"""GET /api/config — returns which integrations are available.
Values are booleans only; secrets are never exposed."""
from fastapi import APIRouter
from config import settings

router = APIRouter()


@router.get("")
async def get_config():
    return {
        # notion ahora refleja el OAuth multi-tenant (no el token global legacy)
        "notion": settings.notion_oauth_enabled,
        "drive": settings.drive_enabled,
        "obsidian": settings.obsidian_enabled,
        "pinecone": bool(settings.PINECONE_API_KEY),
        "mistral": bool(settings.MISTRAL_API_KEY),
    }
