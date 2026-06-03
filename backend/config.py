import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Required
    MISTRAL_API_KEY: str = os.environ.get("MISTRAL_API_KEY", "")
    PINECONE_API_KEY: str = os.environ.get("PINECONE_API_KEY", "")
    PINECONE_INDEX_NAME: str = os.environ.get("PINECONE_INDEX_NAME", "studyai-notes")

    # Optional integrations
    NOTION_TOKEN: str = os.environ.get("NOTION_TOKEN", "")
    NOTION_DATABASE_ID: str = os.environ.get("NOTION_DATABASE_ID", "")
    NOTION_OAUTH_CLIENT_ID: str = os.environ.get("NOTION_OAUTH_CLIENT_ID", "")
    NOTION_OAUTH_CLIENT_SECRET: str = os.environ.get("NOTION_OAUTH_CLIENT_SECRET", "")
    NOTION_REDIRECT_URI: str = os.environ.get("NOTION_REDIRECT_URI", "")
    FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "http://localhost:8080")
    GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.environ.get("GOOGLE_REDIRECT_URI", "")
    GOOGLE_TOKEN_PATH: str = os.environ.get("GOOGLE_TOKEN_PATH", "google_token.json")
    GOOGLE_DRIVE_FOLDER_ID: str = os.environ.get("GOOGLE_DRIVE_FOLDER_ID", "")
    OBSIDIAN_VAULT_PATH: str = os.environ.get("OBSIDIAN_VAULT_PATH", "")
    OBSIDIAN_VAULT_NAME: str = os.environ.get("OBSIDIAN_VAULT_NAME", "")

    # Supabase
    SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY: str = os.environ.get("SUPABASE_SERVICE_KEY", "")

    # Clerk
    CLERK_JWKS_URL: str = os.environ.get("CLERK_JWKS_URL", "")

    # Server
    CORS_ORIGINS: list[str] = [
        o.strip().rstrip("/")
        for o in os.environ.get(
            "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
        ).split(",")
        if o.strip()
    ]
    UPLOADS_DIR: str = os.environ.get("UPLOADS_DIR", "uploads")

    @property
    def notion_enabled(self) -> bool:
        return bool(self.NOTION_TOKEN and self.NOTION_DATABASE_ID)

    @property
    def notion_oauth_enabled(self) -> bool:
        return bool(self.NOTION_OAUTH_CLIENT_ID and self.NOTION_OAUTH_CLIENT_SECRET)

    @property
    def drive_enabled(self) -> bool:
        return bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET)

    @property
    def drive_authenticated(self) -> bool:
        return os.path.exists(self.GOOGLE_TOKEN_PATH)

    @property
    def obsidian_enabled(self) -> bool:
        return bool(self.OBSIDIAN_VAULT_PATH and
                    os.path.isdir(self.OBSIDIAN_VAULT_PATH))


settings = Settings()
