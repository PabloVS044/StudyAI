"""Generate AI flashcards from saved notes."""
from fastapi import APIRouter, HTTPException, Query

from config import settings
from services import sqlite_client, flashcard_generator

router = APIRouter()


@router.post("/{note_id}/generate")
async def generate_note_flashcards(
    note_id: str,
    count: int = Query(default=10, ge=1, le=30),
):
    if not settings.MISTRAL_API_KEY:
        raise HTTPException(status_code=400, detail="MISTRAL_API_KEY no está configurada.")

    row = sqlite_client.get_note(note_id)
    if not row:
        raise HTTPException(status_code=404, detail="Nota no encontrada.")

    content = sqlite_client.note_content(row)

    try:
        cards = flashcard_generator.generate_flashcards(settings.MISTRAL_API_KEY, content, count)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {"note_id": note_id, "flashcards": cards}
