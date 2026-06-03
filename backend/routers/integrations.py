"""Integration endpoints: Notion OAuth, Google Drive OAuth, Obsidian, validation."""
import re
import secrets
import unicodedata
from pathlib import Path
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse, Response
from pydantic import BaseModel

from auth import get_current_user
from config import settings
from services import supabase_client, notion_service, obsidian_service, drive_service

router = APIRouter()


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _require_note(note_id: str, user_id: str) -> dict:
    row = supabase_client.get_note(note_id, user_id)
    if not row:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    return row


def _persist_drive_refresh(user_id: str, updated: Optional[dict]) -> None:
    if updated:
        supabase_client.update_integration(user_id, "google", **updated)


# ---------------------------------------------------------------------------
# GET /me
# ---------------------------------------------------------------------------

@router.get("/me")
async def get_my_integrations(user_id: str = Depends(get_current_user)):
    notion = supabase_client.get_integration(user_id, "notion")
    google = supabase_client.get_integration(user_id, "google")
    return {
        "notion": {
            "connected": notion is not None and bool(notion.get("access_token")),
            "account": notion.get("account_label") if notion else None,
            "book": notion.get("target_label") if notion else None,
            "available": settings.notion_oauth_enabled,
        },
        "google": {
            "connected": google is not None and bool(google.get("access_token")),
            "account": google.get("account_label") if google else None,
            "folder": google.get("target_label") if google else None,
            "available": settings.drive_enabled,
        },
    }


# ---------------------------------------------------------------------------
# Notion — connect (literal route before /{provider})
# ---------------------------------------------------------------------------

@router.get("/notion/connect")
async def notion_connect(user_id: str = Depends(get_current_user)):
    if not settings.notion_oauth_enabled:
        raise HTTPException(status_code=400, detail="Notion OAuth no configurado (faltan NOTION_OAUTH_CLIENT_ID y/o NOTION_OAUTH_CLIENT_SECRET)")
    state = secrets.token_urlsafe(32)
    supabase_client.create_oauth_state(state, user_id, "notion")
    auth_url = (
        "https://api.notion.com/v1/oauth/authorize"
        f"?client_id={settings.NOTION_OAUTH_CLIENT_ID}"
        "&response_type=code"
        "&owner=user"
        f"&redirect_uri={quote(settings.NOTION_REDIRECT_URI, safe='')}"
        f"&state={state}"
    )
    return {"auth_url": auth_url}


@router.get("/notion/callback")
async def notion_callback(code: str, state: str):
    state_data = supabase_client.pop_oauth_state(state)
    if not state_data:
        raise HTTPException(status_code=400, detail="Estado OAuth invalido o expirado")
    user_id = state_data["user_id"]

    try:
        token_data = notion_service.exchange_code(
            client_id=settings.NOTION_OAUTH_CLIENT_ID,
            client_secret=settings.NOTION_OAUTH_CLIENT_SECRET,
            code=code,
            redirect_uri=settings.NOTION_REDIRECT_URI,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error al obtener token de Notion: {exc}")

    supabase_client.upsert_integration(
        user_id,
        "notion",
        access_token=token_data.get("access_token"),
        account_label=token_data.get("workspace_name", ""),
    )
    return RedirectResponse(url=settings.FRONTEND_URL.rstrip("/") + "/integrations")


@router.get("/notion/parents")
async def notion_parents(user_id: str = Depends(get_current_user)):
    integration = supabase_client.get_integration(user_id, "notion")
    if not integration or not integration.get("access_token"):
        raise HTTPException(status_code=400, detail="Notion no conectado")
    try:
        return notion_service.search_parents(integration["access_token"])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error de Notion: {exc}")


@router.get("/notion/books")
async def notion_books(user_id: str = Depends(get_current_user)):
    integration = supabase_client.get_integration(user_id, "notion")
    if not integration or not integration.get("access_token"):
        raise HTTPException(status_code=400, detail="Notion no conectado")
    try:
        return notion_service.search_databases(integration["access_token"])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error de Notion: {exc}")


class CreateBookBody(BaseModel):
    title: str
    parent_page_id: Optional[str] = None


@router.post("/notion/book")
async def notion_create_book(body: CreateBookBody, user_id: str = Depends(get_current_user)):
    integration = supabase_client.get_integration(user_id, "notion")
    if not integration or not integration.get("access_token"):
        raise HTTPException(status_code=400, detail="Notion no conectado")

    token = integration["access_token"]
    parent_page_id = body.parent_page_id

    if not parent_page_id:
        try:
            pages = notion_service.search_parents(token)
            if pages:
                parent_page_id = pages[0]["id"]
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error buscando paginas: {exc}")

    if not parent_page_id:
        raise HTTPException(status_code=400, detail="No se encontro una pagina padre. Proporciona parent_page_id.")

    try:
        db = notion_service.create_book_database(token, parent_page_id, body.title)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error creando base de datos: {exc}")

    supabase_client.update_integration(user_id, "notion", target_id=db["id"], target_label=db["title"])
    return db


class SelectBookBody(BaseModel):
    database_id: str
    title: str


@router.post("/notion/select-book")
async def notion_select_book(body: SelectBookBody, user_id: str = Depends(get_current_user)):
    integration = supabase_client.get_integration(user_id, "notion")
    if not integration or not integration.get("access_token"):
        raise HTTPException(status_code=400, detail="Notion no conectado")
    supabase_client.update_integration(user_id, "notion", target_id=body.database_id, target_label=body.title)
    return {"id": body.database_id, "title": body.title}


@router.post("/notion/export/{note_id}")
async def notion_export(note_id: str, user_id: str = Depends(get_current_user)):
    integration = supabase_client.get_integration(user_id, "notion")
    if not integration or not integration.get("access_token"):
        raise HTTPException(status_code=400, detail="Notion no conectado")
    if not integration.get("target_id"):
        raise HTTPException(status_code=400, detail="No has seleccionado un libro de Notion. Crea o selecciona uno primero.")

    row = _require_note(note_id, user_id)
    content = supabase_client.note_content(row)

    try:
        url = notion_service.create_note_page(
            token=integration["access_token"],
            database_id=integration["target_id"],
            note_id=note_id,
            filename=row["filename"],
            content=content,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error de Notion: {exc}")

    if url:
        supabase_client.update_note(note_id, user_id, notion_url=url)

    return {"success": True, "url": url}


# ---------------------------------------------------------------------------
# Google Drive — connect
# ---------------------------------------------------------------------------

@router.get("/google/connect")
async def google_connect(user_id: str = Depends(get_current_user)):
    if not settings.drive_enabled:
        raise HTTPException(status_code=400, detail="Google Drive no configurado (faltan GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET)")
    state = secrets.token_urlsafe(32)
    supabase_client.create_oauth_state(state, user_id, "google")

    from google_auth_oauthlib.flow import Flow
    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
    flow = Flow.from_client_config(
        client_config,
        scopes=["https://www.googleapis.com/auth/drive.file",
                "https://www.googleapis.com/auth/userinfo.email",
                "openid"],
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state,
    )
    return {"auth_url": auth_url}


@router.get("/google/callback")
async def google_callback(code: str, state: str):
    state_data = supabase_client.pop_oauth_state(state)
    if not state_data:
        raise HTTPException(status_code=400, detail="Estado OAuth invalido o expirado")
    user_id = state_data["user_id"]

    try:
        token_data = drive_service.exchange_code(
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            redirect_uri=settings.GOOGLE_REDIRECT_URI,
            code=code,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error al obtener token de Google: {exc}")

    supabase_client.upsert_integration(
        user_id,
        "google",
        access_token=token_data.get("access_token"),
        refresh_token=token_data.get("refresh_token"),
        expires_at=token_data.get("expires_at"),
        account_label=token_data.get("email", ""),
    )
    return RedirectResponse(url=settings.FRONTEND_URL.rstrip("/") + "/integrations")


@router.get("/google/folders")
async def google_folders(user_id: str = Depends(get_current_user)):
    integration = supabase_client.get_integration(user_id, "google")
    if not integration or not integration.get("access_token"):
        raise HTTPException(status_code=400, detail="Google Drive no conectado")
    try:
        folders, updated = drive_service.list_folders(integration)
        _persist_drive_refresh(user_id, updated)
        return folders
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error de Drive: {exc}")


class CreateFolderBody(BaseModel):
    name: str
    parent_id: Optional[str] = None


@router.post("/google/folder")
async def google_create_folder(body: CreateFolderBody, user_id: str = Depends(get_current_user)):
    integration = supabase_client.get_integration(user_id, "google")
    if not integration or not integration.get("access_token"):
        raise HTTPException(status_code=400, detail="Google Drive no conectado")
    try:
        folder, updated = drive_service.create_folder(integration, body.name, body.parent_id)
        _persist_drive_refresh(user_id, updated)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error de Drive: {exc}")
    supabase_client.update_integration(user_id, "google", target_id=folder["id"], target_label=folder["name"])
    return folder


class SelectFolderBody(BaseModel):
    folder_id: str
    name: str


@router.post("/google/select-folder")
async def google_select_folder(body: SelectFolderBody, user_id: str = Depends(get_current_user)):
    integration = supabase_client.get_integration(user_id, "google")
    if not integration or not integration.get("access_token"):
        raise HTTPException(status_code=400, detail="Google Drive no conectado")
    supabase_client.update_integration(user_id, "google", target_id=body.folder_id, target_label=body.name)
    return {"id": body.folder_id, "name": body.name}


@router.post("/drive/export/{note_id}")
async def drive_export(note_id: str, user_id: str = Depends(get_current_user)):
    integration = supabase_client.get_integration(user_id, "google")
    if not integration or not integration.get("access_token"):
        raise HTTPException(status_code=400, detail="Google Drive no conectado")
    if not integration.get("target_id"):
        raise HTTPException(status_code=400, detail="No has seleccionado una carpeta de Drive. Crea o selecciona una primero.")

    row = _require_note(note_id, user_id)

    try:
        file_id, url, updated = drive_service.upload_note_image(
            token=integration,
            note_id=note_id,
            original_filename=row["filename"],
            uploads_dir=settings.UPLOADS_DIR,
            folder_id=integration["target_id"],
        )
        _persist_drive_refresh(user_id, updated)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error de Drive: {exc}")

    supabase_client.update_note(note_id, user_id, drive_file_id=file_id, drive_url=url)
    return {"success": True, "url": url}


# ---------------------------------------------------------------------------
# DELETE /{provider}  — must come after all literal /notion/* and /google/* routes
# ---------------------------------------------------------------------------

@router.delete("/{provider}")
async def disconnect_integration(provider: str, user_id: str = Depends(get_current_user)):
    if provider not in ("notion", "google"):
        raise HTTPException(status_code=400, detail="Proveedor invalido. Usa 'notion' o 'google'.")
    supabase_client.delete_integration(user_id, provider)
    return {"disconnected": True}


# ---------------------------------------------------------------------------
# Obsidian — export .md
# ---------------------------------------------------------------------------

@router.get("/obsidian/{note_id}/export")
async def export_obsidian(note_id: str, user_id: str = Depends(get_current_user)):
    row = _require_note(note_id, user_id)
    content = supabase_client.note_content(row)
    md = obsidian_service.to_markdown(
        note_id=note_id,
        filename=row["filename"],
        created_at=row.get("created_at", ""),
        content=content,
        notion_url=row.get("notion_url"),
        drive_url=row.get("drive_url"),
    )
    title = content.get("titulo") or row["filename"]
    normalized = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode("ascii")
    safe = re.sub(r"[^\w\s\-]", "", normalized).strip().replace(" ", "_") or "nota"
    return Response(
        content=md.encode("utf-8"),
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{safe}.md"'},
    )


# ---------------------------------------------------------------------------
# Obsidian — save to vault
# ---------------------------------------------------------------------------

@router.post("/obsidian/{note_id}/save-vault")
async def save_obsidian_vault(note_id: str, user_id: str = Depends(get_current_user)):
    if not settings.obsidian_enabled:
        raise HTTPException(status_code=400, detail="Obsidian vault no configurado (falta OBSIDIAN_VAULT_PATH)")

    row = _require_note(note_id, user_id)
    content = supabase_client.note_content(row)

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

    supabase_client.update_note(note_id, user_id, obsidian_path=path)

    vault_name = settings.OBSIDIAN_VAULT_NAME or Path(settings.OBSIDIAN_VAULT_PATH).name
    rel_file = f"StudyAI/{Path(path).stem}"
    obsidian_uri = f"obsidian://open?vault={quote(vault_name)}&file={quote(rel_file)}"

    return {"success": True, "path": path, "obsidian_uri": obsidian_uri}


# ---------------------------------------------------------------------------
# Validation (global Mistral/Pinecone status — kept as-is)
# ---------------------------------------------------------------------------

@router.post("/validate")
async def validate_integrations():
    mistral_valid = False
    if settings.MISTRAL_API_KEY:
        try:
            try:
                from mistralai import Mistral
            except ImportError:
                from mistralai.client import Mistral
            client = Mistral(api_key=settings.MISTRAL_API_KEY)
            client.models.list()
            mistral_valid = True
        except Exception:
            pass

    pinecone_valid = False
    if settings.PINECONE_API_KEY:
        try:
            from pinecone import Pinecone
            pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            indexes = [idx.name for idx in pc.list_indexes()]
            if settings.PINECONE_INDEX_NAME in indexes:
                pinecone_valid = True
        except Exception:
            pass

    notion_valid = False
    if settings.NOTION_TOKEN:
        try:
            from notion_client import Client
            client = Client(auth=settings.NOTION_TOKEN)
            client.users.me()
            notion_valid = True
        except Exception:
            pass

    drive_valid = False
    if settings.drive_enabled and settings.drive_authenticated:
        try:
            from google.oauth2.credentials import Credentials
            from google.auth.transport.requests import Request
            creds = Credentials.from_authorized_user_file(
                settings.GOOGLE_TOKEN_PATH,
                ["https://www.googleapis.com/auth/drive.file"],
            )
            if not creds.valid:
                if creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                    with open(settings.GOOGLE_TOKEN_PATH, "w") as f:
                        f.write(creds.to_json())
                    drive_valid = True
            else:
                drive_valid = True
        except Exception:
            pass

    return {
        "mistral": mistral_valid,
        "pinecone": pinecone_valid,
        "notion": notion_valid,
        "drive": drive_valid,
    }
