from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from config import settings
from routers import extract, notes, integrations, config_router, chat, summaries, flashcards

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="StudyAI API", version="2.0.0", docs_url="/api/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Exception handlers ────────────────────────────────────────────────────────
_DB_ERROR_MSG = "No se pudo conectar a la base de datos. Revisa SUPABASE_URL y SUPABASE_SERVICE_KEY."


@app.exception_handler(httpx.ConnectError)
async def httpx_connect_error_handler(request: Request, exc: httpx.ConnectError):
    return JSONResponse(status_code=503, content={"detail": _DB_ERROR_MSG})


@app.exception_handler(RuntimeError)
async def runtime_error_handler(request: Request, exc: RuntimeError):
    msg = str(exc)
    if "SUPABASE" in msg or "supabase" in msg.lower():
        return JSONResponse(status_code=503, content={"detail": _DB_ERROR_MSG})
    # re-raise other RuntimeErrors as 500
    return JSONResponse(status_code=500, content={"detail": msg})


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(extract.router,       prefix="/api/extract",       tags=["extract"])
app.include_router(notes.router,         prefix="/api/notes",         tags=["notes"])
app.include_router(integrations.router,  prefix="/api/integrations",  tags=["integrations"])
app.include_router(config_router.router, prefix="/api/config",        tags=["config"])
app.include_router(summaries.router,     prefix="/api/summaries",     tags=["summaries"])
app.include_router(chat.router,          prefix="/api/chat",          tags=["chat"])
app.include_router(flashcards.router,    prefix="/api/flashcards",    tags=["flashcards"])


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
