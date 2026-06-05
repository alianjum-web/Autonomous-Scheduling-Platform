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

PHI_FIELDS = frozenset(
    {
        "patient_name",
        "patient_phone",
        "patient_email",
        "full_name",
        "chief_complaint",
        "ai_summary",
    }
)


def scrub_phi_text(message: str) -> str:
    for label, pattern in PHI_PATTERNS.items():
        message = pattern.sub(f"[{label.upper()}_REDACTED]", message)
    return message


def _redact_mapping(data: dict[str, Any]) -> dict[str, Any]:
    return {
        key: "[REDACTED]" if key in PHI_FIELDS else scrub_phi_text(val) if isinstance(val, str) else val
        for key, val in data.items()
    }


def redact_phi_processor(_logger: Any, _method: str, event_dict: dict[str, Any]) -> dict[str, Any]:
    for field in PHI_FIELDS:
        if field in event_dict:
            event_dict[field] = "[REDACTED]"

    for key in ("event", "message"):
        if key in event_dict:
            event_dict[key] = scrub_phi_text(str(event_dict[key]))

    extra = event_dict.get("extra_data")
    if isinstance(extra, dict):
        event_dict["extra_data"] = _redact_mapping(extra)

    return event_dict


def configure_logging(level: int = logging.INFO) -> None:
    shared_processors: list[Any] = [
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
