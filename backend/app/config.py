import os
from pathlib import Path
from typing import List, Union, Any, Optional
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator

# Always load .env relative to the backend directory, NOT current working directory
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_DIR / ".env"
if not os.environ.get("VERCEL") and ENV_PATH.exists():
    load_dotenv(ENV_PATH, override=False)


class Settings(BaseSettings):
    PROJECT_NAME: str = "BloodBridge API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "sqlite:///./bloodbridge.db"

    # Auth & JWT
    JWT_SECRET: str = "super-secret-bloodbridge-jwt-key-change-in-production-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Automation
    AUTOMATION_ENABLED: bool = True

    # LLM Provider Configuration
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    GEMINI_MODEL: str = "gemini-flash-lite-latest"
    GROQ_MODEL: str = "qwen/qwen3.8-27b"
    OPENAI_MODEL: str = "gpt-4o-mini"

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    model_config = {
        "env_file": str(ENV_PATH) if (not os.environ.get("VERCEL") and ENV_PATH.exists()) else None,
        "case_sensitive": True,
        "extra": "ignore",
    }

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> List[str]:
        if isinstance(value, str):
            return [o.strip() for o in value.split(",") if o.strip()]
        if isinstance(value, list):
            return value
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("JWT_SECRET", mode="after")
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        env = os.environ.get("ENVIRONMENT", "development").lower()
        is_prod = env in ("production", "prod") or bool(os.environ.get("VERCEL"))
        insecure_keys = (
            "super-secret-bloodbridge-jwt-key-change-in-production-2026",
            "secret",
            "changeme",
            "",
        )
        if is_prod and value in insecure_keys:
            env_secret = os.environ.get("JWT_SECRET")
            if env_secret and env_secret not in insecure_keys:
                return env_secret
            raise ValueError("JWT_SECRET must have no insecure default in production. Set a strong JWT_SECRET environment variable.")
        return value

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        # Vercel/Neon integrations may expose the URL under a different name
        if value.startswith("sqlite"):
            for key in ("POSTGRES_URL", "STORAGE_URL", "NEON_DATABASE_URL"):
                if os.environ.get(key):
                    value = os.environ[key]
                    break

        # SQLAlchemy 2 rejects the legacy "postgres://" scheme, and 2.1 defaults
        # plain "postgresql://" to psycopg 3; this project ships psycopg2
        for prefix in ("postgres://", "postgresql://"):
            if value.startswith(prefix) and not value.startswith("postgresql+psycopg2://"):
                value = "postgresql+psycopg2://" + value[len(prefix):]
                break

        # Ensure sslmode=require for postgresql connections
        if "postgresql" in value and "sslmode" not in value:
            delimiter = "&" if "?" in value else "?"
            value = f"{value}{delimiter}sslmode=require"

        # Vercel's filesystem is read-only except /tmp (data there is not persistent)
        if value.startswith("sqlite") and os.environ.get("VERCEL"):
            value = "sqlite:////tmp/bloodbridge.db"

        return value


settings = Settings()
