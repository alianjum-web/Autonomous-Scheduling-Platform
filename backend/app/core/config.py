import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


def _resolve_env_file() -> str:
    return os.environ.get("ENV_FILE", ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_resolve_env_file(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Autonomous Scheduling Platform"
    debug: bool = False

    # CORS — restrict to Next.js origin only
    frontend_origin: str = "http://localhost:3000"

    # Supabase
    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str

    # Redis — Upstash (serverless) preferred in production; falls back to local Redis
    upstash_redis_url: str = ""
    redis_url: str = "redis://localhost:6379/0"

    @property
    def effective_redis_url(self) -> str:
        return self.upstash_redis_url or self.redis_url

    # OpenAI — enable Zero Data Retention in OpenAI dashboard + BAA before production PHI
    openai_api_key: str = ""
    openai_chat_model: str = "gpt-4o"
    openai_zero_data_retention: bool = True

    # Google Calendar (optional — mock slots when unset)
    google_calendar_id: str = ""
    google_service_account_json: str = ""
    google_oauth_client_id: str = ""
    google_oauth_client_secret: str = ""
    google_oauth_refresh_token: str = ""

    # Observability
    sentry_dsn: str = ""
    environment: str = "development"
    # Log retention/access — enforce at log aggregator (Railway/Grafana); emitted as _log_policy metadata
    log_retention_days: int = 30
    log_access_class: str = "restricted_ops"

    # Ingestion limits
    max_upload_bytes: int = 50 * 1024 * 1024  # 50 MB
    embed_timeout_seconds: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
