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
    notebook_id: Optional[int] = None


class ExamIn(BaseModel):
    notebook_id: Optional[int] = None
    note_ids: Optional[list[str]] = None
    count: int = 10
    difficulty: str = "medio"


def _combine_content(rows: list[dict]) -> dict:
    """Merge several notes' content into a single content dict for quiz generation."""
    combined: dict = {
        "titulo": "Parcial",
        "texto_principal": "",
        "definiciones": [],
        "listas": [],
        "formulas": [],
        "observaciones": "",
    }
    textos: list[str] = []
    obs: list[str] = []
    for row in rows:
        c = supabase_client.note_content(row)
        if c.get("titulo"):
            textos.append(f"## {c['titulo']}")
        if c.get("texto_principal"):
            textos.append(c["texto_principal"])
        if isinstance(c.get("definiciones"), list):
            combined["definiciones"].extend(c["definiciones"])
        if isinstance(c.get("listas"), list):
            combined["listas"].extend(c["listas"])
        if isinstance(c.get("formulas"), list):
            combined["formulas"].extend(c["formulas"])
        if c.get("observaciones"):
            obs.append(c["observaciones"])
    combined["texto_principal"] = "\n\n".join(textos)
    combined["observaciones"] = "\n\n".join(obs)
    return combined


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


@router.post("/exam")
async def generate_exam(
    body: ExamIn,
    user_id: str = Depends(get_current_user),
):
    if body.difficulty not in _DIFFICULTIES:
        raise HTTPException(status_code=400, detail="Dificultad no válida.")
    if not settings.MISTRAL_API_KEY:
        raise HTTPException(status_code=400, detail="MISTRAL_API_KEY no está configurada.")
    if not (3 <= body.count <= 20):
        raise HTTPException(status_code=400, detail="count debe estar entre 3 y 20.")

    source: dict = {}
    if body.notebook_id is not None:
        if not supabase_client.get_notebook(body.notebook_id, user_id):
            raise HTTPException(status_code=404, detail="Notebook no encontrado.")
        rows = supabase_client.list_notes_by_notebook(user_id, body.notebook_id)
        source = {"notebook_id": body.notebook_id}
    elif body.note_ids:
        rows = []
        for nid in body.note_ids:
            r = supabase_client.get_note(nid, user_id)
            if r:
                rows.append(r)
        source = {"note_ids": body.note_ids}
    else:
        raise HTTPException(status_code=400, detail="Indica notebook_id o note_ids.")

    if not rows:
        raise HTTPException(status_code=400, detail="No hay notas para generar el parcial.")

    content = _combine_content(rows)

    try:
        questions = quiz_generator.generate_quiz(
            settings.MISTRAL_API_KEY, content, body.count, body.difficulty
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {"questions": questions, "difficulty": body.difficulty, "source": source}


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
        notebook_id=body.notebook_id,
    )
    return {"saved": True}


@router.get("/attempts")
async def get_attempts(
    note_id: Optional[str] = Query(default=None),
    user_id: str = Depends(get_current_user),
):
    return supabase_client.list_quiz_attempts(user_id, note_id)
