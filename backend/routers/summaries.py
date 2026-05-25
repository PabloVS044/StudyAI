"""Generate AI summaries from saved notes."""
import json
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import settings
from services import sqlite_client

try:
    from mistralai import Mistral
except ImportError:
    from mistralai.client import Mistral

router = APIRouter()


class SummaryRequest(BaseModel):
    note_ids: list[str]
    style: str = "detailed"
    language: str = "es"


class SummaryResponse(BaseModel):
    title: str
    summary: str
    key_concepts: list[str]
    note_ids: list[str]
    style: str


_STYLE_PROMPTS = {
    "brief": "Genera un resumen breve (maximo 150 palabras) de los siguientes apuntes.",
    "detailed": "Genera un resumen detallado y bien estructurado de los siguientes apuntes.",
    "bullet_points": "Genera un resumen en formato de puntos clave de los siguientes apuntes.",
}


def _clean_tags(value) -> list[str]:
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except Exception:
            value = [value]
    if not isinstance(value, list):
        return []
    return [str(tag).strip() for tag in value if str(tag).strip()]


def _note_text(row: dict) -> tuple[str, str]:
    content = sqlite_client.note_content(row)
    title = content.get("titulo") or row["title"] or row["filename"]
    parts: list[str] = []

    if content.get("texto_principal"):
        parts.append(str(content["texto_principal"]))

    for definition in content.get("definiciones") or []:
        if isinstance(definition, dict):
            term = definition.get("termino")
            desc = definition.get("definicion")
            if term or desc:
                parts.append(f"{term or 'Definicion'}: {desc or ''}")
        else:
            parts.append(str(definition))

    for note_list in content.get("listas") or []:
        if isinstance(note_list, dict):
            parts.extend(str(item) for item in note_list.get("items") or [])
        else:
            parts.append(str(note_list))

    for formula in content.get("formulas") or []:
        if isinstance(formula, dict):
            formula_text = formula.get("latex") or formula.get("texto_plano")
            desc = formula.get("descripcion")
            if formula_text or desc:
                parts.append(f"{desc or 'Formula'}: {formula_text or ''}")

    for figure in content.get("diagramas_figuras") or []:
        if isinstance(figure, dict) and figure.get("descripcion"):
            parts.append(str(figure["descripcion"]))

    if content.get("observaciones"):
        parts.append(str(content["observaciones"]))

    return title, "\n".join(parts)


def _parse_json_response(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        if raw.lstrip().startswith("json"):
            raw = raw.lstrip()[4:]
    raw = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", raw).strip()
    return json.loads(raw, strict=False)


@router.post("/generate", response_model=SummaryResponse)
async def generate_summary(req: SummaryRequest):
    if not settings.MISTRAL_API_KEY:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY no configurada")
    if not req.note_ids:
        raise HTTPException(status_code=400, detail="Debes seleccionar al menos una nota")

    note_sections: list[str] = []
    valid_note_ids: list[str] = []
    for note_id in req.note_ids:
        row = sqlite_client.get_note(note_id)
        if not row:
            continue
        title, text = _note_text(row)
        if not text.strip():
            continue
        valid_note_ids.append(note_id)
        note_sections.append(f"TITULO: {title}\n{text}")

    if not note_sections:
        raise HTTPException(status_code=404, detail="No se encontraron notas validas")

    style = req.style if req.style in _STYLE_PROMPTS else "detailed"
    combined = "\n\n---\n\n".join(note_sections)[:12000]
    prompt = f"""{_STYLE_PROMPTS[style]}

Responde en {req.language}. Devuelve un JSON con esta estructura exacta:
{{
  "title": "titulo del resumen",
  "summary": "el resumen completo",
  "key_concepts": ["concepto1", "concepto2", "concepto3", "concepto4", "concepto5"]
}}

APUNTES:
{combined}

Responde UNICAMENTE con el JSON, sin markdown ni texto extra."""

    client = Mistral(api_key=settings.MISTRAL_API_KEY)
    try:
        response = client.chat.complete(
            model="mistral-small-latest",
            messages=[{"role": "user", "content": prompt}],
        )
        data = _parse_json_response(response.choices[0].message.content or "{}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error generando resumen: {exc}") from exc

    concepts = data.get("key_concepts") or []
    if not isinstance(concepts, list):
        concepts = []

    return SummaryResponse(
        title=data.get("title") or "Resumen",
        summary=data.get("summary") or "",
        key_concepts=[str(concept) for concept in concepts],
        note_ids=valid_note_ids,
        style=style,
    )


@router.get("/list")
async def list_summary_notes():
    rows = sqlite_client.list_notes(100)
    return [
        {
            "note_id": row["note_id"],
            "title": row["title"],
            "filename": row["filename"],
            "date": row.get("created_at", ""),
            "tags": _clean_tags(row.get("tags"))
            or _clean_tags(sqlite_client.note_content(row).get("tags")),
        }
        for row in rows
    ]
