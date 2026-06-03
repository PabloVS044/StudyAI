"""Generate and track multiple-choice quizzes from saved notes."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from auth import get_current_user
from config import settings
from services import supabase_client, quiz_generator

router = APIRouter()

_DIFFICULTIES = {"facil", "medio", "dificil"}
_MODES = {"normal", "imposible"}


class AttemptIn(BaseModel):
    note_id: str
    difficulty: str
    mode: str
    total: int
    correct: int
    max_streak: int
    passed: bool


@router.post("/{note_id}/generate")
async def generate_note_quiz(
    note_id: str,
    count: int = Query(default=5, ge=3, le=20),
    difficulty: str = Query(default="medio"),
    user_id: str = Depends(get_current_user),
):
    if difficulty not in _DIFFICULTIES:
        raise HTTPException(status_code=400, detail="Dificultad no válida.")
    if not settings.MISTRAL_API_KEY:
        raise HTTPException(status_code=400, detail="MISTRAL_API_KEY no está configurada.")

    row = supabase_client.get_note(note_id, user_id)
    if not row:
        raise HTTPException(status_code=404, detail="Nota no encontrada.")

    content = supabase_client.note_content(row)

    try:
        questions = quiz_generator.generate_quiz(
            settings.MISTRAL_API_KEY, content, count, difficulty
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {"note_id": note_id, "difficulty": difficulty, "questions": questions}


@router.post("/attempt")
async def save_attempt(
    body: AttemptIn,
    user_id: str = Depends(get_current_user),
):
    supabase_client.save_quiz_attempt(
        user_id=user_id,
        note_id=body.note_id,
        difficulty=body.difficulty,
        mode=body.mode,
        total=body.total,
        correct=body.correct,
        max_streak=body.max_streak,
        passed=body.passed,
    )
    return {"saved": True}


@router.get("/attempts")
async def get_attempts(
    note_id: Optional[str] = Query(default=None),
    user_id: str = Depends(get_current_user),
):
    return supabase_client.list_quiz_attempts(user_id, note_id)
