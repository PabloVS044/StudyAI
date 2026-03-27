"""POST /api/extract — OCR one or more note images via Mistral pixtral-12b."""
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile

from config import settings
from services import ocr

router = APIRouter()

_ALLOWED: dict[str, str] = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "webp": "image/webp", "gif": "image/gif", "bmp": "image/bmp",
}


def _ext(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


@router.post("")
async def extract_images(files: Annotated[list[UploadFile], File(...)]):
    if not settings.MISTRAL_API_KEY:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY no configurada")

    uploads = Path(settings.UPLOADS_DIR)
    uploads.mkdir(exist_ok=True)

    results = []
    for file in files:
        if not file.filename:
            continue

        ext = _ext(file.filename)
        mime = _ALLOWED.get(ext)
        if not mime:
            results.append({
                "note_id": None,
                "filename": file.filename,
                "error": f"Formato no soportado: {ext}. Usa PNG, JPG, WEBP.",
                "content": None,
            })
            continue

        note_id = str(uuid.uuid4())
        image_bytes = await file.read()

        # Persist image so integrations can use it later without re-upload
        (uploads / f"{note_id}.{ext}").write_bytes(image_bytes)

        try:
            content = ocr.extract_content(settings.MISTRAL_API_KEY, image_bytes, mime)
            results.append({
                "note_id": note_id,
                "filename": file.filename,
                "image_ext": ext,
                "content": content,
                "error": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as exc:
            results.append({
                "note_id": note_id,
                "filename": file.filename,
                "image_ext": ext,
                "content": None,
                "error": str(exc),
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

    return results
