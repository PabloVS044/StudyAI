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
) -> None:
    _client().table("notes").upsert({
        "note_id": note_id,
        "title": title,
        "filename": filename,
        "image_ext": image_ext,
        "content_json": content_json,
        "tags": tags,
        "user_id": user_id,
    }).execute()


def get_note(note_id: str, user_id: Optional[str] = None) -> Optional[dict]:
    q = _client().table("notes").select("*").eq("note_id", note_id)
    if user_id:
        q = q.eq("user_id", user_id)
    result = q.limit(1).execute()
    rows = result.data or []
    return rows[0] if rows else None


def list_notes(limit: int = 50, user_id: Optional[str] = None) -> list[dict]:
    q = _client().table("notes").select("*").order("created_at", desc=True).limit(limit)
    if user_id:
        q = q.eq("user_id", user_id)
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
) -> None:
    _client().table("quiz_attempts").insert({
        "user_id": user_id,
        "note_id": note_id,
        "difficulty": difficulty,
        "mode": mode,
        "total": total,
        "correct": correct,
        "max_streak": max_streak,
        "passed": passed,
    }).execute()


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
