"""Upload note images to Google Drive using a service account."""
import io
from pathlib import Path
from typing import Optional

_MIME_MAP = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "webp": "image/webp", "gif": "image/gif", "bmp": "image/bmp",
}
_SCOPES = ["https://www.googleapis.com/auth/drive.file"]


def _build_service(service_account_json: str):
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    creds = service_account.Credentials.from_service_account_file(
        service_account_json, scopes=_SCOPES
    )
    return build("drive", "v3", credentials=creds)


def upload_note_image(
    note_id: str,
    original_filename: str,
    uploads_dir: str,
    service_account_json: str,
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

    service = _build_service(service_account_json)
    from googleapiclient.http import MediaIoBaseUpload

    file_meta: dict = {"name": original_filename}
    if drive_folder_id:
        file_meta["parents"] = [drive_folder_id]

    media = MediaIoBaseUpload(io.BytesIO(image_path.read_bytes()), mimetype=mime_type)
    uploaded = service.files().create(
        body=file_meta, media_body=media, fields="id,webViewLink"
    ).execute()

    # Make publicly readable so anyone with the link can view
    service.permissions().create(
        fileId=uploaded["id"],
        body={"type": "anyone", "role": "reader"},
    ).execute()

    return uploaded["id"], uploaded.get("webViewLink", "")
