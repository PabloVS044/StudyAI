import sqlite3
import json
import os
from pathlib import Path
from contextlib import contextmanager
from typing import Optional

_DB_PATH: Optional[str] = None


def init_db(db_path: str = "studyai.db") -> None:
    global _DB_PATH
    _DB_PATH = db_path
    schema = Path(__file__).parent.parent / "db" / "schema.sql"
    with get_conn() as conn:
        conn.executescript(schema.read_text())


def _path() -> str:
    return _DB_PATH or os.environ.get("DB_PATH", "studyai.db")


@contextmanager
def get_conn():
    conn = sqlite3.connect(_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def create_note(
    note_id: str,
    title: str,
    filename: str,
    image_ext: Optional[str],
    content_json: str,
) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO notes (note_id, title, filename, image_ext, content_json)
            VALUES (?, ?, ?, ?, ?)
            """,
            (note_id, title, filename, image_ext, content_json),
        )


def get_note(note_id: str) -> Optional[dict]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM notes WHERE note_id = ?", (note_id,)
        ).fetchone()
        return dict(row) if row else None


def list_notes(limit: int = 50) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM notes ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


def update_note(note_id: str, **kwargs) -> None:
    if not kwargs:
        return
    cols = ", ".join(f"{k} = ?" for k in kwargs)
    values = [*kwargs.values(), note_id]
    with get_conn() as conn:
        conn.execute(f"UPDATE notes SET {cols} WHERE note_id = ?", values)


def delete_note(note_id: str) -> None:
    with get_conn() as conn:
        conn.execute("DELETE FROM notes WHERE note_id = ?", (note_id,))


def note_content(note: dict) -> dict:
    """Parse the content_json field back to a dict."""
    try:
        return json.loads(note.get("content_json") or "{}")
    except Exception:
        return {}
