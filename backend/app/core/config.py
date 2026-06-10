import os
from functools import lru_cache

from pydantic import AliasChoices, Field, ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _resolve_env_file() -> str:
    """Load backend/.env.development or backend/.env.production (no .env copy step)."""
    if override := os.environ.get("ENV_FILE"):
        return override
    mode = os.environ.get("APP_ENV") or os.environ.get("ENVIRONMENT") or "development"
    if str(mode).strip().lower() == "production":
        return ".env.production"
    return ".env.development"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_resolve_env_file(),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    app_name: str = "Autonomous Scheduling Platform"
    debug: bool = False

    # CORS — restrict to Next.js origin only (no trailing slash; browsers omit it on Origin header)
    frontend_origin: str = "http://localhost:3000"

    @field_validator("frontend_origin")
    @classmethod
    def _normalize_frontend_origin(cls, value: str) -> str:
        return value.strip().rstrip("/")

    # Supabase — loaded from env / .env (defaults satisfy static analysis; min_length enforces presence)
    supabase_url: str = Field(default="", min_length=1)
    # Auth email proxy uses the publishable key (same value as NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel).
    supabase_anon_key: str = Field(
        default="",
        min_length=1,
        validation_alias=AliasChoices("SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    )
    supabase_service_role_key: str = Field(default="", min_length=1)
    supabase_jwt_secret: str = Field(default="", min_length=1)

    # Resend — auth emails via Supabase custom SMTP; transactional via adapters/resend_client
    resend_api_key: str = ""
    resend_from_email: str = ""
    resend_from_name: str = "Autonomous Scheduling Platform"
    resend_smtp_host: str = "smtp.resend.com"
    resend_smtp_port: int = 465
    resend_smtp_username: str = "resend"
    resend_min_interval_seconds: int = 60

    # Redis — Upstash (serverless) preferred in production; falls back to local Redis
    upstash_redis_url: str = ""
    redis_url: str = "redis://localhost:6379/0"

    @property
    def effective_redis_url(self) -> str:
        return self.upstash_redis_url or self.redis_url

    # Feature flags — hot-reloadable JSON (see backend/feature-flags.json)
    feature_flags_path: str = ""

    # OpenAI — enable Zero Data Retention in OpenAI dashboard + BAA before production PHI
    openai_api_key: str = ""
    openai_chat_model: str = "gpt-4o"
    openai_zero_data_retention: bool = True

    # Ollama — local, free; no API key required (install: https://ollama.com)
    ollama_base_url: str = "http://localhost:11434/v1"

    # Google Gemini — https://aistudio.google.com/apikey
    gemini_api_key: str = ""

    # xAI Grok — https://console.x.ai/
    grok_api_key: str = ""
    grok_base_url: str = "https://api.x.ai/v1"

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

    # HIPAA — block AI when tenant has no signed BAA (override via feature-flags.json)
    baa_enforcement: bool = True


_SETTINGS_HINTS: dict[str, str] = {
    "supabase_url": "Set SUPABASE_URL on Render (Supabase project URL).",
    "supabase_anon_key": (
        "Set SUPABASE_ANON_KEY on Render — same publishable key as "
        "NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel (Supabase → Settings → API Keys)."
    ),
    "supabase_service_role_key": "Set SUPABASE_SERVICE_ROLE_KEY on Render.",
    "supabase_jwt_secret": "Set SUPABASE_JWT_SECRET on Render.",
}


def _format_settings_error(exc: ValidationError) -> str:
    lines = ["Backend configuration is incomplete:"]
    for err in exc.errors():
        field = str(err["loc"][0]) if err.get("loc") else "settings"
        hint = _SETTINGS_HINTS.get(field, f"Invalid or missing value for {field}.")
        lines.append(f"  • {hint}")
    lines.append("Render → your service → Environment → add the variables → Save → Manual Deploy.")
    return "\n".join(lines)


@lru_cache
def get_settings() -> Settings:
    try:
        return Settings()
    except ValidationError as exc:
        raise RuntimeError(_format_settings_error(exc)) from exc
