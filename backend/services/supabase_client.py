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
    result = q.maybe_single().execute()
    return result.data


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
