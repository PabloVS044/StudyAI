"""Google Drive service - per-user credentials (no global token file)."""
import io
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

_SCOPES = ["https://www.googleapis.com/auth/drive.file"]
_TOKEN_URI = "https://oauth2.googleapis.com/token"

_MIME_MAP = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "webp": "image/webp", "gif": "image/gif", "bmp": "image/bmp",
}


def _creds_from_token(token: dict, client_id: str = None, client_secret: str = None):
    """Build google.oauth2.credentials.Credentials from a token dict.

    Returns (creds, updated_token_dict).  updated_token_dict is non-None only
    when a refresh happened and the caller should persist the new values.
    """
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request

    cid = client_id or token.get("client_id") or os.environ.get("GOOGLE_CLIENT_ID", "")
    csecret = client_secret or token.get("client_secret") or os.environ.get("GOOGLE_CLIENT_SECRET", "")

    expiry = None
    if token.get("expires_at"):
        try:
            expiry = datetime.fromisoformat(str(token["expires_at"]).replace("Z", "+00:00"))
        except Exception:
            pass

    creds = Credentials(
        token=token.get("access_token"),
        refresh_token=token.get("refresh_token"),
        token_uri=_TOKEN_URI,
        client_id=cid,
        client_secret=csecret,
        scopes=_SCOPES,
    )
    if expiry:
        creds.expiry = expiry

    updated: Optional[dict] = None
    if not creds.valid and creds.refresh_token:
        creds.refresh(Request())
        updated = {
            "access_token": creds.token,
            "expires_at": creds.expiry.isoformat() if creds.expiry else None,
        }

    return creds, updated


def _build_service(token: dict, client_id: str = None, client_secret: str = None):
    """Return (drive_service, updated_token_dict_or_None)."""
    from googleapiclient.discovery import build

    creds, updated = _creds_from_token(token, client_id, client_secret)
    if not creds.valid:
        raise ValueError(
            "Las credenciales de Google Drive son invalidas o expiraron. "
            "Por favor, reconecta tu cuenta."
        )
    return build("drive", "v3", credentials=creds), updated


def exchange_code(
    client_id: str,
    client_secret: str,
    redirect_uri: str,
    code: str,
) -> dict:
    """Exchange an OAuth authorization code for a token dict.

    Returns dict with: access_token, refresh_token, expires_at (ISO string), email.
    """
    from google_auth_oauthlib.flow import Flow

    client_config = {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uris": [redirect_uri],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": _TOKEN_URI,
        }
    }
    flow = Flow.from_client_config(
        client_config,
        scopes=_SCOPES + ["https://www.googleapis.com/auth/userinfo.email", "openid"],
        redirect_uri=redirect_uri,
    )
    flow.fetch_token(code=code)
    creds = flow.credentials

    email = ""
    try:
        import google.auth.transport.requests as gtr
        import requests as _req
        r = _req.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {creds.token}"},
            timeout=10,
        )
        if r.ok:
            email = r.json().get("email", "")
    except Exception:
        pass

    expires_at = creds.expiry.isoformat() if creds.expiry else None

    return {
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
        "expires_at": expires_at,
        "email": email,
    }


def list_folders(token: dict) -> list[dict]:
    """Return [{id, name}] of all non-trashed Drive folders."""
    service, updated = _build_service(token)
    result = []
    page_token = None
    while True:
        kwargs = dict(
            q="mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            spaces="drive",
            fields="nextPageToken, files(id, name)",
            pageSize=100,
        )
        if page_token:
            kwargs["pageToken"] = page_token
        resp = service.files().list(**kwargs).execute()
        result.extend(resp.get("files", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return result, updated


def create_folder(token: dict, name: str, parent_id: str = None) -> tuple[dict, Optional[dict]]:
    """Create a Drive folder. Returns ({id, name}, updated_token_or_None)."""
    service, updated = _build_service(token)
    meta = {
        "name": name,
        "mimeType": "application/vnd.google-apps.folder",
    }
    if parent_id:
        meta["parents"] = [parent_id]
    folder = service.files().create(body=meta, fields="id,name").execute()
    return {"id": folder["id"], "name": folder["name"]}, updated


def upload_note_image(
    token: dict,
    note_id: str,
    original_filename: str,
    uploads_dir: str,
    folder_id: str = None,
) -> tuple[str, str, Optional[dict]]:
    """Find note image in uploads_dir and upload to Drive.

    Returns (file_id, web_view_link, updated_token_or_None).
    Raises ValueError if no image found.
    """
    uploads = Path(uploads_dir)
    image_path = None
    mime_type = "image/jpeg"

    for ext, mime in _MIME_MAP.items():
        p = uploads / f"{note_id}.{ext}"
        if p.exists():
            image_path = p
            mime_type = mime
            break

    if not image_path:
        raise ValueError(f"No se encontro imagen para la nota {note_id}")

    service, updated = _build_service(token)
    from googleapiclient.http import MediaIoBaseUpload

    file_meta: dict = {"name": original_filename}
    if folder_id:
        file_meta["parents"] = [folder_id]

    media = MediaIoBaseUpload(io.BytesIO(image_path.read_bytes()), mimetype=mime_type)
    uploaded = service.files().create(
        body=file_meta, media_body=media, fields="id,webViewLink"
    ).execute()

    try:
        service.permissions().create(
            fileId=uploaded["id"],
            body={"type": "anyone", "role": "reader"},
        ).execute()
    except Exception:
        pass

    return uploaded["id"], uploaded.get("webViewLink", ""), updated
