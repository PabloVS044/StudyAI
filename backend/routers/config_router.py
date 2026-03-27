"""GET /api/config — returns which integrations are available.
Values are booleans only; secrets are never exposed."""
from fastapi import APIRouter
from config import settings

router = APIRouter()


@router.get("")
async def get_config():
    return {
        "notion": settings.notion_enabled,
        "drive": settings.drive_enabled,
        "obsidian": settings.obsidian_enabled,
        "pinecone": bool(settings.PINECONE_API_KEY),
    }
