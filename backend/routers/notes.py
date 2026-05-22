"""CRUD + semantic search for saved notes."""
import json
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from config import settings
from services import embeddings, pinecone_client, sqlite_client

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class SaveRequest(BaseModel):
    note_id: str
    filename: str
    image_ext: str | None = None
    content: dict  # raw NoteContent dict


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5


# ── Helpers ───────────────────────────────────────────────────────────────────

def _clean_tags(value) -> list[str]:
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except Exception:
            value = [value]
    if not isinstance(value, list):
        return []
    return [str(tag).strip() for tag in value if str(tag).strip()][:4]


def _embed_and_upsert(note_id: str, filename: str, content: dict) -> None:
    """Run in background — generate embedding and store in Pinecone."""
    text = embeddings.note_to_embed_text(content)
    vector = embeddings.get_embedding(settings.MISTRAL_API_KEY, text)
    pinecone_client.upsert_vector(
        api_key=settings.PINECONE_API_KEY,
        index_name=settings.PINECONE_INDEX_NAME,
        note_id=note_id,
        vector=vector,
        metadata={
            "title": content.get("titulo") or filename,
            "filename": filename,
            "has_formulas": bool(content.get("formulas")),
            "has_diagrams": bool(content.get("diagramas_figuras")),
            "tags": _clean_tags(content.get("tags")),
        },
    )


def _note_to_item(row: dict) -> dict:
    c = sqlite_client.note_content(row)
    preview = (c.get("texto_principal") or c.get("titulo") or row["filename"])[:300]
    tags = _clean_tags(row.get("tags")) or _clean_tags(c.get("tags"))
    return {
        "note_id": row["note_id"],
        "title": row["title"],
        "filename": row["filename"],
        "image_ext": row.get("image_ext"),
        "date": row.get("created_at", ""),
        "text_preview": preview,
        "has_formulas": bool(c.get("formulas")),
        "has_diagrams": bool(c.get("diagramas_figuras")),
        "notion_url": row.get("notion_url"),
        "drive_url": row.get("drive_url"),
        "tags": tags,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/save")
async def save_note(req: SaveRequest, bg: BackgroundTasks):
    content = dict(req.content)
    tags = _clean_tags(content.get("tags"))
    content["tags"] = tags
    title = (content.get("titulo") or req.filename)[:500]
    sqlite_client.create_note(
        note_id=req.note_id,
        title=title,
        filename=req.filename,
        image_ext=req.image_ext,
        content_json=json.dumps(content, ensure_ascii=False),
        tags=json.dumps(tags, ensure_ascii=False),
    )
    # Embedding is async — doesn't block the save response
    if settings.PINECONE_API_KEY and settings.MISTRAL_API_KEY:
        bg.add_task(_embed_and_upsert, req.note_id, req.filename, content)

    return {"note_id": req.note_id, "saved": True}


@router.get("")
async def list_notes(limit: int = 50):
    rows = sqlite_client.list_notes(limit)
    return [_note_to_item(r) for r in rows]


@router.get("/{note_id}")
async def get_note(note_id: str):
    row = sqlite_client.get_note(note_id)
    if not row:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    item = _note_to_item(row)
    item["content"] = sqlite_client.note_content(row)
    return item


@router.delete("/{note_id}")
async def delete_note(note_id: str):
    sqlite_client.delete_note(note_id)
    if settings.PINECONE_API_KEY:
        try:
            pinecone_client.delete_vector(
                settings.PINECONE_API_KEY, settings.PINECONE_INDEX_NAME, note_id
            )
        except Exception:
            pass
    return {"deleted": True, "note_id": note_id}


@router.post("/search")
async def search_notes(req: SearchRequest):
    if not (settings.PINECONE_API_KEY and settings.MISTRAL_API_KEY):
        raise HTTPException(status_code=400, detail="Pinecone o Mistral no configurados")

    vector = embeddings.get_embedding(settings.MISTRAL_API_KEY, req.query)
    matches = pinecone_client.query_similar(
        settings.PINECONE_API_KEY, settings.PINECONE_INDEX_NAME, vector, req.top_k
    )

    results = []
    for m in matches:
        row = sqlite_client.get_note(m["note_id"])
        if not row:
            continue
        item = _note_to_item(row)
        item["score"] = round(m["score"], 4)
        results.append(item)
    return results
