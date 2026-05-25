"""Integration endpoints: Notion, Google Drive, Obsidian."""
import re
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from config import settings
from services import sqlite_client, notion_service, obsidian_service, drive_service

router = APIRouter()


def _require_note(note_id: str) -> dict:
    row = sqlite_client.get_note(note_id)
    if not row:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    return row


# ── Notion ────────────────────────────────────────────────────────────────────

@router.post("/notion/{note_id}")
async def sync_notion(note_id: str):
    if not settings.notion_enabled:
        raise HTTPException(status_code=400,
                            detail="Notion no configurado (faltan NOTION_TOKEN y/o NOTION_DATABASE_ID)")

    row = _require_note(note_id)
    content = sqlite_client.note_content(row)

    try:
        url = notion_service.create_note_page(
            token=settings.NOTION_TOKEN,
            database_id=settings.NOTION_DATABASE_ID,
            note_id=note_id,
            filename=row["filename"],
            content=content,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error de Notion: {exc}")

    if url:
        sqlite_client.update_note(note_id, notion_url=url)

    return {"success": True, "url": url}


# ── Google Drive ──────────────────────────────────────────────────────────────

@router.get("/google/auth-url")
async def google_auth_url():
    if not settings.drive_enabled:
        raise HTTPException(status_code=400, detail="Google Drive no configurado (faltan GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET)")

    import google_auth_oauthlib.flow
    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }

    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        client_config,
        scopes=["https://www.googleapis.com/auth/drive.file"],
        redirect_uri=settings.GOOGLE_REDIRECT_URI
    )

    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent"
    )
    return {"auth_url": auth_url}


@router.get("/google/callback")
async def google_callback(code: str):
    if not settings.drive_enabled:
        raise HTTPException(status_code=400, detail="Google Drive no configurado")

    import google_auth_oauthlib.flow
    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }

    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        client_config,
        scopes=["https://www.googleapis.com/auth/drive.file"],
        redirect_uri=settings.GOOGLE_REDIRECT_URI
    )

    try:
        flow.fetch_token(code=code)
        credentials = flow.credentials
        with open(settings.GOOGLE_TOKEN_PATH, "w") as f:
            f.write(credentials.to_json())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error al obtener token de Google: {exc}")

    from fastapi.responses import RedirectResponse
    frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:5173"
    if not frontend_url.endswith("/integrations"):
        frontend_url = frontend_url.rstrip("/") + "/integrations"

    return RedirectResponse(url=frontend_url)


@router.post("/drive/{note_id}")
async def sync_drive(note_id: str):
    if not settings.drive_enabled:
        raise HTTPException(status_code=400,
                            detail="Google Drive no configurado (faltan GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET)")

    if not settings.drive_authenticated:
        raise HTTPException(status_code=400,
                            detail="Google Drive no autenticado. Por favor, conecta tu cuenta de Google.")

    row = _require_note(note_id)

    try:
        result = drive_service.upload_note_image(
            note_id=note_id,
            original_filename=row["filename"],
            uploads_dir=settings.UPLOADS_DIR,
            token_path=settings.GOOGLE_TOKEN_PATH,
            drive_folder_id=settings.GOOGLE_DRIVE_FOLDER_ID or None,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error de Drive: {exc}")

    if not result:
        raise HTTPException(status_code=404,
                            detail="Imagen del apunte no encontrada en uploads/")

    file_id, url = result
    sqlite_client.update_note(note_id, drive_file_id=file_id, drive_url=url)
    return {"success": True, "file_id": file_id, "url": url}


# ── Obsidian — download .md ───────────────────────────────────────────────────

@router.get("/obsidian/{note_id}/export")
async def export_obsidian(note_id: str):
    row = _require_note(note_id)
    content = sqlite_client.note_content(row)
    md = obsidian_service.to_markdown(
        note_id=note_id,
        filename=row["filename"],
        created_at=row.get("created_at", ""),
        content=content,
        notion_url=row.get("notion_url"),
        drive_url=row.get("drive_url"),
    )
    title = content.get("titulo") or row["filename"]
    safe = re.sub(r'[^\w\s\-]', '', title).strip().replace(' ', '_') or "nota"
    return Response(
        content=md.encode("utf-8"),
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{safe}.md"'},
    )


# ── Obsidian — save to vault ──────────────────────────────────────────────────

@router.post("/obsidian/{note_id}/save-vault")
async def save_obsidian_vault(note_id: str):
    if not settings.obsidian_enabled:
        raise HTTPException(status_code=400,
                            detail="Obsidian vault no configurado (falta OBSIDIAN_VAULT_PATH)")

    row = _require_note(note_id)
    content = sqlite_client.note_content(row)

    try:
        path = obsidian_service.save_to_vault(
            vault_path=settings.OBSIDIAN_VAULT_PATH,
            note_id=note_id,
            filename=row["filename"],
            created_at=row.get("created_at", ""),
            content=content,
            notion_url=row.get("notion_url"),
            drive_url=row.get("drive_url"),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error al guardar en vault: {exc}")

    sqlite_client.update_note(note_id, obsidian_path=path)
    return {"success": True, "path": path}
