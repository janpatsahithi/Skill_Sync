import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "datasets"

# Load backend/.env for local development and Render env vars at runtime.
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv()


class Settings:
    def __init__(self) -> None:
        self.MONGO_URI = os.getenv("MONGO_URI", "").strip()
        self.DB_NAME = os.getenv("DB_NAME", "skillsync").strip()
        self.JWT_SECRET = os.getenv("JWT_SECRET", "").strip()
        self.JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256").strip()
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
        self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
        self.GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()
        self.CHROMA_PERSIST_DIRECTORY = os.getenv("CHROMA_PERSIST_DIRECTORY", "/tmp/chroma").strip()
        cors_origins = os.getenv("CORS_ORIGINS", "*").strip()
        self.CORS_ORIGINS = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]


settings = Settings()
