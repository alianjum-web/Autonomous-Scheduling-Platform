"""Deterministic emergency detection — NEVER uses an LLM.

Keyword list is loaded from admin-only DB config at startup, with safe defaults.
Review quarterly with licensed clinical staff.
"""

from __future__ import annotations

import re
from typing import Pattern

from app.core.logger import get_logger

logger = get_logger(__name__)

# Hardcoded — cannot be overridden by clinic configuration
EMERGENCY_LEGAL_DISCLAIMER = (
    "This AI assistant cannot provide medical advice. In any emergency, call 911 immediately."
)

EMERGENCY_RESPONSE_BODY = (
    "⚠ URGENT: If you are experiencing a medical emergency, "
    "please call 911 immediately or go to your nearest Emergency Room. "
    "Do not wait for this chat. Your safety is the priority.\n\n"
    f"{EMERGENCY_LEGAL_DISCLAIMER}\n\n"
    "If this is not an emergency, please describe your concern and "
    "we will connect you with our care team right away."
)

DEFAULT_PATTERNS: list[str] = [
    r"\bchest\s+pain\b",
    r"\bcant\s+breathe\b",
    r"\bcannot\s+breathe\b",
    r"\bshortness\s+of\s+breath\b",
    r"\bstroke\b",
    r"\bheart\s+attack\b",
    r"\bseizure\b",
    r"\bunconscious\b",
    r"\bpassing\s+out\b",
    r"\bsevere\s+bleeding\b",
    r"\boverdose\b",
    r"\bsuicid\b",
    r"\bcan't\s+feel\b",
    r"\bnumbness\b.*\bface\b",
    r"\b911\b",
    r"\bemergency\b.*\broom\b",
    r"\bER\b",
]

_active_patterns: list[str] = list(DEFAULT_PATTERNS)
_compiled_regex: Pattern[str] | None = None


def _compile(patterns: list[str]) -> Pattern[str]:
    return re.compile("|".join(patterns), re.IGNORECASE)


def get_emergency_regex() -> Pattern[str]:
    global _compiled_regex
    if _compiled_regex is None:
        _compiled_regex = _compile(_active_patterns)
    return _compiled_regex


def detect_emergency(message: str) -> bool:
    if not message or not message.strip():
        return False
    return bool(get_emergency_regex().search(message))


def get_emergency_response() -> str:
    return EMERGENCY_RESPONSE_BODY


async def load_keywords_from_db() -> None:
    """Load admin-configured patterns at FastAPI startup."""
    global _active_patterns, _compiled_regex

    from app.services import supabase_client

    try:
        patterns = await supabase_client.load_emergency_keyword_patterns()
        if patterns:
            _active_patterns = patterns
            _compiled_regex = _compile(_active_patterns)
            logger.info(
                "Emergency keywords loaded from config",
                extra={"extra_data": {"count": len(_active_patterns)}},
            )
        else:
            _compiled_regex = _compile(DEFAULT_PATTERNS)
            logger.info("Using default emergency keyword patterns")
    except Exception as exc:
        _active_patterns = list(DEFAULT_PATTERNS)
        _compiled_regex = _compile(_active_patterns)
        logger.warning(
            "Failed to load emergency keywords; using defaults",
            extra={"extra_data": {"error": str(exc)}},
        )


def get_active_patterns() -> list[str]:
    return list(_active_patterns)
