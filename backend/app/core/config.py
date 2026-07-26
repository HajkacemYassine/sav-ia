from pydantic_settings import BaseSettings
from pathlib import Path

ENV_FILE = Path(__file__).parent.parent.parent / ".env"
if not ENV_FILE.exists():
    ENV_FILE = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    APP_NAME: str = "SAV-IA Platform"
    APP_ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    DATABASE_URL: str
    QDRANT_URL: str = "http://localhost:6333"
    REDIS_URL: str = "redis://redis:6379/0"

    GOOGLE_API_KEY: str
    EMBEDDING_MODEL: str = "text-embedding-004"
    LLM_MODEL: str = "gemini-2.5-flash"
    ADMIN_EMAILS: list[str] = ["admin@example.com"]

    # Notifications
    FRONTEND_URL: str = "http://localhost:5173"
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False
    SMTP_FROM_EMAIL: str = "no-reply@sav-ia.local"

    # Groq
    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # LM Studio (Ornith) — optionnel, pour comparaison
    LM_STUDIO_URL: str = "http://localhost:1234/v1"
    LM_STUDIO_MODEL: str = "ornith-1.0-9b"
    USE_LM_STUDIO: bool = False

    # JWT Auth
    JWT_SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = "utf-8"
        extra = "ignore" 


settings = Settings()