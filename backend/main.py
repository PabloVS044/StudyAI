from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from config import settings
from services import sqlite_client
from routers import extract, notes, integrations, config_router, chat

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="StudyAI API", version="2.0.0", docs_url="/api/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(extract.router,       prefix="/api/extract",       tags=["extract"])
app.include_router(notes.router,         prefix="/api/notes",         tags=["notes"])
app.include_router(integrations.router,  prefix="/api/integrations",  tags=["integrations"])
app.include_router(config_router.router, prefix="/api/config",        tags=["config"])
app.include_router(chat.router,          prefix="/api/chat",          tags=["chat"])


# ── Serve uploaded images ─────────────────────────────────────────────────────
_MIME = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "webp": "image/webp", "gif": "image/gif", "bmp": "image/bmp",
}


@app.get("/api/uploads/{note_id}", tags=["uploads"])
async def get_upload(note_id: str):
    uploads = Path(settings.UPLOADS_DIR)
    for ext, mime in _MIME.items():
        p = uploads / f"{note_id}.{ext}"
        if p.exists():
            return FileResponse(str(p), media_type=mime)
    raise HTTPException(status_code=404, detail="Imagen no encontrada")


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "version": "2.0.0"}


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    Path(settings.UPLOADS_DIR).mkdir(exist_ok=True)
    sqlite_client.init_db(settings.DB_PATH)
