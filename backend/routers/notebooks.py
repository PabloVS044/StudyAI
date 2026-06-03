"""CRUD para notebooks (libros de notas que agrupan varias notas)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from services import supabase_client

router = APIRouter()


class NotebookCreate(BaseModel):
    name: str
    description: Optional[str] = None


class NotebookUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class AssignNotes(BaseModel):
    note_ids: list[str]


def _note_to_item(row: dict) -> dict:
    c = supabase_client.note_content(row)
    preview = (c.get("texto_principal") or c.get("titulo") or row["filename"])[:300]
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
        "notebook_id": row.get("notebook_id"),
    }


@router.post("")
async def create_notebook(body: NotebookCreate, user_id: str = Depends(get_current_user)):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="El nombre es obligatorio.")
    return supabase_client.create_notebook(user_id, name, body.description)


@router.get("")
async def list_notebooks(user_id: str = Depends(get_current_user)):
    return supabase_client.list_notebooks(user_id)


@router.get("/{notebook_id}")
async def get_notebook(notebook_id: int, user_id: str = Depends(get_current_user)):
    notebook = supabase_client.get_notebook(notebook_id, user_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook no encontrado.")
    rows = supabase_client.list_notes_by_notebook(user_id, notebook_id)
    return {"notebook": notebook, "notes": [_note_to_item(r) for r in rows]}


@router.patch("/{notebook_id}")
async def update_notebook(
    notebook_id: int,
    body: NotebookUpdate,
    user_id: str = Depends(get_current_user),
):
    if not supabase_client.get_notebook(notebook_id, user_id):
        raise HTTPException(status_code=404, detail="Notebook no encontrado.")
    supabase_client.update_notebook(
        notebook_id, user_id, name=body.name, description=body.description
    )
    return supabase_client.get_notebook(notebook_id, user_id)


@router.delete("/{notebook_id}")
async def delete_notebook(notebook_id: int, user_id: str = Depends(get_current_user)):
    if not supabase_client.get_notebook(notebook_id, user_id):
        raise HTTPException(status_code=404, detail="Notebook no encontrado.")
    supabase_client.delete_notebook(notebook_id, user_id)
    return {"deleted": True, "id": notebook_id}


@router.post("/{notebook_id}/notes")
async def assign_notes(
    notebook_id: int,
    body: AssignNotes,
    user_id: str = Depends(get_current_user),
):
    if not supabase_client.get_notebook(notebook_id, user_id):
        raise HTTPException(status_code=404, detail="Notebook no encontrado.")
    supabase_client.assign_notes_to_notebook(user_id, notebook_id, body.note_ids)
    return {"assigned": len(body.note_ids), "notebook_id": notebook_id}


@router.delete("/{notebook_id}/notes/{note_id}")
async def remove_note(
    notebook_id: int,
    note_id: str,
    user_id: str = Depends(get_current_user),
):
    supabase_client.remove_note_from_notebook(user_id, note_id)
    return {"removed": True, "note_id": note_id}
