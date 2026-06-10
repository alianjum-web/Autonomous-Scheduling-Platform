"""Resolve backend/.env.development vs backend/.env.production."""

from __future__ import annotations

import os
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]

ENV_DEVELOPMENT = ".env.development"
ENV_PRODUCTION = ".env.production"


def resolve_env_filename() -> str:
    """Return `.env.development` or `.env.production` from APP_ENV / ENVIRONMENT."""
    if override := os.environ.get("ENV_FILE"):
        return Path(override).name
    mode = os.environ.get("APP_ENV") or os.environ.get("ENVIRONMENT") or "development"
    if str(mode).strip().lower() == "production":
        return ENV_PRODUCTION
    return ENV_DEVELOPMENT


def resolve_env_file_path() -> Path:
    """Absolute path to the active env file under backend/."""
    return BACKEND_ROOT / resolve_env_filename()
