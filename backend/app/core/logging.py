"""PHI-safe structured logger using structlog + custom processor."""

from __future__ import annotations

import logging
import re
import sys
from typing import Any

import structlog

PHI_PATTERNS: dict[str, re.Pattern[str]] = {
    "phone": re.compile(r"\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}"),
    "email": re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"),
    "ssn": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "dob": re.compile(r"\b(0[1-9]|1[0-2])/(0[1-9]|[12]\d|3[01])/(19|20)\d{2}\b"),
}

PHI_FIELDS = frozenset[str](
    {
        "patient_name",
        "patient_phone",
        "patient_email",
        "full_name",
        "chief_complaint",
        "ai_summary",
    }
)

# Raw LLM prompts/responses must never appear in logs — redact unconditionally.
LLM_CONTENT_FIELDS = frozenset[str](
    {
        "prompt",
        "llm_prompt",
        "llm_response",
        "completion",
        "completions",
        "messages",
        "message_history",
        "chat_history",
        "raw_response",
        "system_prompt",
        "user_message",
        "assistant_message",
        "token_stream",
        "model_input",
        "model_output",
    }
)

SENSITIVE_FIELDS = PHI_FIELDS | LLM_CONTENT_FIELDS

_LOG_POLICY: dict[str, Any] | None = None


def scrub_phi_text(message: str) -> str:
    for label, pattern in PHI_PATTERNS.items():
        message = pattern.sub(f"[{label.upper()}_REDACTED]", message)
    return message


def _redact_sensitive_key(key: str, value: Any) -> Any:
    if key in LLM_CONTENT_FIELDS:
        return "[LLM_CONTENT_REDACTED]"
    if key in PHI_FIELDS:
        return "[REDACTED]"
    return redact_value(value)


def redact_value(value: Any) -> Any:
    """Recursively scrub PHI patterns and sensitive field keys from log payloads."""
    if isinstance(value, dict):
        return {key: _redact_sensitive_key(key, val) for key, val in value.items()}
    if isinstance(value, list):
        return [redact_value(item) for item in value]
    if isinstance(value, str):
        return scrub_phi_text(value)
    return value


def _get_log_policy() -> dict[str, Any]:
    global _LOG_POLICY
    if _LOG_POLICY is None:
        from app.core.config import get_settings

        settings = get_settings()
        _LOG_POLICY = {
            "retention_days": settings.log_retention_days,
            "access": settings.log_access_class,
        }
    return _LOG_POLICY


def redact_phi_processor(_logger: Any, _method: str, event_dict: dict[str, Any]) -> dict[str, Any]:
    event_dict["_log_policy"] = _get_log_policy()
    return redact_value(event_dict)


def configure_logging(level: int = logging.INFO) -> None:
    shared_processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.ExtraAdder(),
        structlog.processors.TimeStamper(fmt="iso"),
        redact_phi_processor,
    ]

    structlog.configure(
        processors=shared_processors + [structlog.stdlib.ProcessorFormatter.wrap_for_formatter],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        processor=structlog.processors.JSONRenderer(),
        foreign_pre_chain=shared_processors,
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
