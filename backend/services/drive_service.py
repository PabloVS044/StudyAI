"""Upload note images to Google Drive using OAuth2."""
import io
import os
from pathlib import Path
from typing import Optional

_MIME_MAP = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "webp": "image/webp", "gif": "image/gif", "bmp": "image/bmp",
}
_SCOPES = ["https://www.googleapis.com/auth/drive.file"]


def _build_service(token_path: str):
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build

    if not os.path.exists(token_path):
        raise ValueError("No se encontraron credenciales de Google Drive. Por favor, conecta tu cuenta.")

    creds = Credentials.from_authorized_user_file(token_path, _SCOPES)

    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(token_path, "w") as token_file:
                token_file.write(creds.to_json())
        else:
            raise ValueError("Las credenciales de Google Drive han expirado o son inválidas. Por favor, vuelve a conectar tu cuenta.")

    return build("drive", "v3", credentials=creds)


def _get_or_create_studyai_folder(service) -> str:
    """Search for or create a folder named 'StudyAI'."""
    query = "name = 'StudyAI' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    results = service.files().list(q=query, spaces='drive', fields='files(id)').execute()
    files = results.get('files', [])
    if files:
        return files[0]['id']

    folder_meta = {
        'name': 'StudyAI',
        'mimeType': 'application/vnd.google-apps.folder'
    }
    folder = service.files().create(body=folder_meta, fields='id').execute()
    return folder['id']


def upload_note_image(
    note_id: str,
    original_filename: str,
    uploads_dir: str,
    token_path: str,
    drive_folder_id: Optional[str] = None,
) -> Optional[tuple[str, str]]:
    """Find the image for note_id in uploads_dir and upload it.
    Returns (file_id, web_view_link) or None."""
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
        return None

    service = _build_service(token_path)
    from googleapiclient.http import MediaIoBaseUpload

    # If folder ID is not specified, get or create "StudyAI" folder
    if not drive_folder_id:
        try:
            drive_folder_id = _get_or_create_studyai_folder(service)
        except Exception:
            pass

    file_meta: dict = {"name": original_filename}
    if drive_folder_id:
        file_meta["parents"] = [drive_folder_id]

    media = MediaIoBaseUpload(io.BytesIO(image_path.read_bytes()), mimetype=mime_type)
    uploaded = service.files().create(
        body=file_meta, media_body=media, fields="id,webViewLink"
    ).execute()

    # Make publicly readable so anyone with the link can view
    try:
        service.permissions().create(
            fileId=uploaded["id"],
            body={"type": "anyone", "role": "reader"},
        ).execute()
    except Exception:
        pass

    return uploaded["id"], uploaded.get("webViewLink", "")
