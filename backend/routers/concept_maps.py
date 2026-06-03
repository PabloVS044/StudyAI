"""Generate concept maps (nodes + edges) from saved notes."""
from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from config import settings
from services import supabase_client, concept_map_generator

router = APIRouter()


@router.post("/{note_id}/generate")
async def generate_note_concept_map(
    note_id: str,
    user_id: str = Depends(get_current_user),
):
    if not settings.MISTRAL_API_KEY:
        raise HTTPException(status_code=400, detail="MISTRAL_API_KEY no está configurada.")

    row = supabase_client.get_note(note_id, user_id)
    if not row:
        raise HTTPException(status_code=404, detail="Nota no encontrada.")

    content = supabase_client.note_content(row)

    try:
        result = concept_map_generator.generate_concept_map(settings.MISTRAL_API_KEY, content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {"note_id": note_id, "nodes": result["nodes"], "edges": result["edges"]}
