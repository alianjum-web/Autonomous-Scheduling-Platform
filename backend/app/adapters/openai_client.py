"""Centralized OpenAI client — PHI-adjacent calls use Zero Data Retention settings.

Requires OpenAI BAA + org-level Zero Data Retention enabled in the OpenAI dashboard
before processing real patient data. See docs/HIPAA_COMPLIANCE.md.
"""

from __future__ import annotations

from openai import AsyncOpenAI

from app.core.config import get_settings

_client: AsyncOpenAI | None = None


def get_openai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        settings = get_settings()
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


def get_openai_client_optional() -> AsyncOpenAI | None:
    settings = get_settings()
    if not settings.openai_api_key:
        return None
    return get_openai_client()


def phi_safe_chat_kwargs() -> dict:
    """Disable API-side storage for chat completions (requires ZDR BAA at org level)."""
    settings = get_settings()
    if not settings.openai_zero_data_retention:
        return {}
    return {"store": False}
