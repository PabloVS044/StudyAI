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
    GOOGLE_SERVICE_ACCOUNT_JSON: str = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    GOOGLE_DRIVE_FOLDER_ID: str = os.environ.get("GOOGLE_DRIVE_FOLDER_ID", "")
    OBSIDIAN_VAULT_PATH: str = os.environ.get("OBSIDIAN_VAULT_PATH", "")

    # Server
    CORS_ORIGINS: list[str] = os.environ.get(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")
    UPLOADS_DIR: str = os.environ.get("UPLOADS_DIR", "uploads")
    DB_PATH: str = os.environ.get("DB_PATH", "studyai.db")

    @property
    def notion_enabled(self) -> bool:
        return bool(self.NOTION_TOKEN and self.NOTION_DATABASE_ID)

    @property
    def drive_enabled(self) -> bool:
        return bool(self.GOOGLE_SERVICE_ACCOUNT_JSON and
                    os.path.exists(self.GOOGLE_SERVICE_ACCOUNT_JSON))

    @property
    def obsidian_enabled(self) -> bool:
        return bool(self.OBSIDIAN_VAULT_PATH and
                    os.path.isdir(self.OBSIDIAN_VAULT_PATH))


settings = Settings()
