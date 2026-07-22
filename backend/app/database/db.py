"""
Supabase client + app settings.
All config is read from environment variables (see .env.example).

Config loading notes:
- pydantic-settings reads `.env` and process env vars ITSELF; field
  defaults must not call os.getenv(...), because that runs at class
  definition time (before .env is loaded) and freezes an empty string
  as the "default", which pydantic-settings then treats as an explicit
  value and never overrides. This was the root cause of
  SUPABASE_URL / SUPABASE_SERVICE_KEY appearing "missing" even though
  they were present in .env.
- Required secrets have no default at all, so a missing/blank .env
  fails fast with a clear pydantic validation error instead of silently
  starting the app in a broken state.
"""
from functools import lru_cache
from pathlib import Path

from pydantic import ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from supabase import create_client, Client

# Resolve .env relative to this file (backend/.env), not relative to
# whatever directory the process happens to be launched from.
_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    gemini_api_key: str
    gemini_model: str = "gemini-3.5-flash"
    supabase_url: str
    supabase_service_key: str
    supabase_bucket: str = "incident-images"
    frontend_origin: str = "http://localhost:5173"
    environment: str = "development"

    @field_validator("gemini_api_key", "supabase_url", "supabase_service_key")
    @classmethod
    def _not_blank(cls, value: str, info: ValidationInfo) -> str:
        if not value or not value.strip():
            raise ValueError(
                f"{info.field_name.upper()} is missing or empty. "
                f"Set it in backend/.env (see backend/.env.example)."
            )
        return value


@lru_cache
def get_settings() -> Settings:
    try:
        return Settings()
    except Exception as exc:  # pydantic.ValidationError
        raise RuntimeError(
            "Backend configuration is invalid.\n"
            f"Expected an .env file at: {_ENV_FILE}\n"
            "Required variables: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY.\n"
            f"Details: {exc}"
        ) from exc


@lru_cache
def get_supabase() -> Client:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_key:
        raise RuntimeError(
            "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env"
        )
    return create_client(settings.supabase_url, settings.supabase_service_key)
