"""Supabase client — drop-in replacement for sqlite_client."""
import json
from typing import Optional

from supabase import create_client, Client

from config import settings


def _client() -> Client:
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise RuntimeError("SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridas")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def create_note(
    note_id: str,
    title: str,
    filename: str,
    image_ext: Optional[str],
    content_json: str,
    tags: str = "[]",
    user_id: str = "",
    notebook_id: Optional[int] = None,
) -> None:
    row = {
        "note_id": note_id,
        "title": title,
        "filename": filename,
        "image_ext": image_ext,
        "content_json": content_json,
        "tags": tags,
        "user_id": user_id,
    }
    if notebook_id is not None:
        row["notebook_id"] = notebook_id
    _client().table("notes").upsert(row).execute()


def get_note(note_id: str, user_id: Optional[str] = None) -> Optional[dict]:
    q = _client().table("notes").select("*").eq("note_id", note_id)
    if user_id:
        q = q.eq("user_id", user_id)
    result = q.limit(1).execute()
    rows = result.data or []
    return rows[0] if rows else None


def list_notes(
    limit: int = 50,
    user_id: Optional[str] = None,
    notebook_id: Optional[int] = None,
) -> list[dict]:
    q = _client().table("notes").select("*").order("created_at", desc=True).limit(limit)
    if user_id:
        q = q.eq("user_id", user_id)
    if notebook_id is not None:
        q = q.eq("notebook_id", notebook_id)
    result = q.execute()
    return result.data or []


def update_note(note_id: str, user_id: Optional[str] = None, **kwargs) -> None:
    if not kwargs:
        return
    q = _client().table("notes").update(kwargs).eq("note_id", note_id)
    if user_id:
        q = q.eq("user_id", user_id)
    q.execute()


def delete_note(note_id: str, user_id: Optional[str] = None) -> None:
    q = _client().table("notes").delete().eq("note_id", note_id)
    if user_id:
        q = q.eq("user_id", user_id)
    q.execute()


def note_content(note: dict) -> dict:
    try:
        val = note.get("content_json") or "{}"
        if isinstance(val, dict):
            return val
        return json.loads(val)
    except Exception:
        return {}


# ---------------------------------------------------------------------------
# OAuth state helpers
# ---------------------------------------------------------------------------

def create_oauth_state(state: str, user_id: str, provider: str) -> None:
    _client().table("oauth_states").insert({
        "state": state,
        "user_id": user_id,
        "provider": provider,
    }).execute()


def pop_oauth_state(state: str) -> Optional[dict]:
    result = (
        _client()
        .table("oauth_states")
        .select("user_id, provider")
        .eq("state", state)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    if not rows:
        return None
    _client().table("oauth_states").delete().eq("state", state).execute()
    return rows[0]  # {"user_id": ..., "provider": ...}


# ---------------------------------------------------------------------------
# Integration CRUD helpers
# ---------------------------------------------------------------------------

def upsert_integration(user_id: str, provider: str, **fields) -> None:
    _client().table("user_integrations").upsert({
        "user_id": user_id,
        "provider": provider,
        "updated_at": "now()",
        **fields,
    }).execute()


def get_integration(user_id: str, provider: str) -> Optional[dict]:
    result = (
        _client()
        .table("user_integrations")
        .select("*")
        .eq("user_id", user_id)
        .eq("provider", provider)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    return rows[0] if rows else None


def update_integration(user_id: str, provider: str, **fields) -> None:
    if not fields:
        return
    _client().table("user_integrations").update({
        "updated_at": "now()",
        **fields,
    }).eq("user_id", user_id).eq("provider", provider).execute()


def delete_integration(user_id: str, provider: str) -> None:
    _client().table("user_integrations").delete().eq("user_id", user_id).eq("provider", provider).execute()


# ---------------------------------------------------------------------------
# Quiz attempts
# ---------------------------------------------------------------------------

def save_quiz_attempt(
    user_id: str,
    note_id: str,
    difficulty: str,
    mode: str,
    total: int,
    correct: int,
    max_streak: int,
    passed: bool,
    notebook_id: Optional[int] = None,
) -> None:
    row = {
        "user_id": user_id,
        "note_id": note_id,
        "difficulty": difficulty,
        "mode": mode,
        "total": total,
        "correct": correct,
        "max_streak": max_streak,
        "passed": passed,
    }
    if notebook_id is not None:
        row["notebook_id"] = notebook_id
    _client().table("quiz_attempts").insert(row).execute()


def list_quiz_attempts(user_id: str, note_id: Optional[str] = None) -> list[dict]:
    q = (
        _client()
        .table("quiz_attempts")
        .select("*")
        .eq("user_id", user_id)
    )
    if note_id:
        q = q.eq("note_id", note_id)
    result = q.order("created_at", desc=True).execute()
    return result.data or []


# ---------------------------------------------------------------------------
# Notebooks (libros de notas)
# ---------------------------------------------------------------------------

def create_notebook(user_id: str, name: str, description: Optional[str] = None) -> dict:
    result = _client().table("notebooks").insert({
        "user_id": user_id,
        "name": name,
        "description": description,
    }).execute()
    rows = result.data or []
    return rows[0] if rows else {}


def list_notebooks(user_id: str) -> list[dict]:
    result = (
        _client()
        .table("notebooks")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    notebooks = result.data or []
    for nb in notebooks:
        count_res = (
            _client()
            .table("notes")
            .select("note_id", count="exact")
            .eq("user_id", user_id)
            .eq("notebook_id", nb["id"])
            .execute()
        )
        nb["note_count"] = count_res.count or 0
    return notebooks


def get_notebook(notebook_id: int, user_id: str) -> Optional[dict]:
    result = (
        _client()
        .table("notebooks")
        .select("*")
        .eq("id", notebook_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    return rows[0] if rows else None


def update_notebook(notebook_id: int, user_id: str, **fields) -> None:
    fields = {k: v for k, v in fields.items() if v is not None}
    if not fields:
        return
    (
        _client()
        .table("notebooks")
        .update(fields)
        .eq("id", notebook_id)
        .eq("user_id", user_id)
        .execute()
    )


def delete_notebook(notebook_id: int, user_id: str) -> None:
    # Desvincula las notas (no las borra)
    (
        _client()
        .table("notes")
        .update({"notebook_id": None})
        .eq("user_id", user_id)
        .eq("notebook_id", notebook_id)
        .execute()
    )
    (
        _client()
        .table("notebooks")
        .delete()
        .eq("id", notebook_id)
        .eq("user_id", user_id)
        .execute()
    )


def assign_notes_to_notebook(user_id: str, notebook_id: int, note_ids: list[str]) -> None:
    if not note_ids:
        return
    (
        _client()
        .table("notes")
        .update({"notebook_id": notebook_id})
        .eq("user_id", user_id)
        .in_("note_id", note_ids)
        .execute()
    )


def remove_note_from_notebook(user_id: str, note_id: str) -> None:
    (
        _client()
        .table("notes")
        .update({"notebook_id": None})
        .eq("user_id", user_id)
        .eq("note_id", note_id)
        .execute()
    )


def list_notes_by_notebook(user_id: str, notebook_id: int) -> list[dict]:
    return list_notes(limit=1000, user_id=user_id, notebook_id=notebook_id)
