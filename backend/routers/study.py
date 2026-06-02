"""Study router for StudyAI - flashcards and summaries via Mistral."""
import re
import json
from fastapi import APIRouter, HTTPException
from config import settings
from services import sqlite_client

try:
    from mistralai import Mistral
except ImportError:
    from mistralai.client import Mistral

router = APIRouter()


def _serialize_content(content: dict, title: str) -> str:
    """Build a plain-text representation of the note content (chat.py style)."""
    text = f"--- APUNTE: {title} ---\n"
    if content.get("texto_principal"):
        text += f"Texto Principal:\n{content['texto_principal']}\n"
    if content.get("definiciones"):
        text += "Definiciones:\n"
        for d in content["definiciones"]:
            if d.get("termino") and d.get("definicion"):
                text += f"- {d.get('termino')}: {d.get('definicion')}\n"
    if content.get("formulas"):
        text += "Fórmulas:\n"
        for f in content["formulas"]:
            eq = f.get("latex") or f.get("texto_plano") or ""
            desc = f.get("descripcion") or ""
            text += f"- {desc}: {eq}\n"
    if content.get("listas"):
        for l in content["listas"]:
            tipo = l.get("tipo") or "viñetas"
            text += f"Lista ({tipo}):\n"
            for item in (l.get("items") or []):
                text += f"  * {item}\n"
    if content.get("observaciones"):
        text += f"Observaciones/Anotaciones:\n{content['observaciones']}\n"
    return text


def _load_note_text(note_id: str) -> str:
    row = sqlite_client.get_note(note_id)
    if not row:
        raise HTTPException(status_code=404, detail="Apunte no encontrado")
    content = sqlite_client.note_content(row)
    return _serialize_content(content, row["title"])


def _parse_json_response(raw: str):
    """Strip markdown fences and control chars, then json.loads (ocr.py style)."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    raw = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', raw)
    return json.loads(raw, strict=False)


@router.post("/{note_id}/flashcards")
async def generate_flashcards(note_id: str):
    if not settings.MISTRAL_API_KEY:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY no configurada")

    note_text = _load_note_text(note_id)

    prompt = (
        "A partir del siguiente apunte académico, genera entre 6 y 10 tarjetas de estudio "
        "(flashcards) que cubran los conceptos más importantes.\n"
        "Responde ÚNICAMENTE con un array JSON válido, sin markdown ni explicaciones, "
        'con esta estructura exacta:\n'
        '[{"pregunta": "...", "respuesta": "..."}]\n\n'
        f"Apunte:\n{note_text}"
    )

    try:
        client = Mistral(api_key=settings.MISTRAL_API_KEY)
        resp = client.chat.complete(
            model="mistral-small-latest",
            messages=[{"role": "user", "content": prompt}],
        )
        raw = resp.choices[0].message.content
        cards = _parse_json_response(raw)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error al generar flashcards: {exc}")

    if not isinstance(cards, list):
        raise HTTPException(status_code=500, detail="Respuesta de Mistral inválida")

    clean = [
        {"pregunta": str(c["pregunta"]), "respuesta": str(c["respuesta"])}
        for c in cards
        if isinstance(c, dict) and c.get("pregunta") and c.get("respuesta")
    ]

    sqlite_client.replace_flashcards(note_id, clean)
    return {"note_id": note_id, "flashcards": sqlite_client.list_flashcards(note_id)}


@router.get("/{note_id}/flashcards")
async def get_flashcards(note_id: str):
    return {"note_id": note_id, "flashcards": sqlite_client.list_flashcards(note_id)}


@router.post("/{note_id}/summary")
async def generate_summary(note_id: str):
    if not settings.MISTRAL_API_KEY:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY no configurada")

    note_text = _load_note_text(note_id)

    prompt = (
        "Genera un resumen claro y bien estructurado del siguiente apunte académico.\n"
        "Devuelve el resumen directamente en formato Markdown (usa encabezados, listas y "
        "negritas donde sea apropiado). No incluyas explicaciones adicionales fuera del resumen.\n\n"
        f"Apunte:\n{note_text}"
    )

    try:
        client = Mistral(api_key=settings.MISTRAL_API_KEY)
        resp = client.chat.complete(
            model="mistral-small-latest",
            messages=[{"role": "user", "content": prompt}],
        )
        summary_md = resp.choices[0].message.content.strip()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error al generar resumen: {exc}")

    sqlite_client.upsert_summary(note_id, summary_md)
    return {"note_id": note_id, "summary_md": summary_md}


@router.get("/{note_id}/summary")
async def get_summary(note_id: str):
    return {"note_id": note_id, "summary_md": sqlite_client.get_summary(note_id)}
