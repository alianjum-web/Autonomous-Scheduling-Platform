"""Extract slot, name, and phone from patient chat for autonomous booking."""

from __future__ import annotations

import re
from datetime import datetime

PHONE_RE = re.compile(
    r"(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10,11}\b"
)
NAME_RE = re.compile(
    r"(?:my name is|i am|i'm|this is|name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})",
    re.IGNORECASE,
)


def match_slot_from_message(message: str, slots: list[str]) -> str | None:
    """Match patient confirmation text to an ISO slot from available slots."""
    if not slots:
        return None

    normalized = message.strip().lower()
    if not normalized:
        return None

    for slot in slots:
        if slot in message:
            return slot

    for slot in slots:
        try:
            dt = datetime.fromisoformat(slot.replace("Z", "+00:00"))
        except ValueError:
            continue

        candidates = {
            dt.strftime("%A").lower(),
            dt.strftime("%a").lower(),
            str(dt.hour),
            str(dt.hour % 12 or 12),
            dt.strftime("%H:%M"),
            dt.strftime("%I:%M").lstrip("0"),
            dt.strftime("%B").lower(),
            dt.strftime("%b").lower(),
            str(dt.day),
        }
        if any(token and token in normalized for token in candidates):
            return slot

        time_phrase = dt.strftime("%I:%M %p").lower().lstrip("0")
        if time_phrase in normalized:
            return slot

    confirm_words = ("yes", "confirm", "works", "book", "that time", "sounds good", "perfect")
    if any(word in normalized for word in confirm_words) and len(slots) == 1:
        return slots[0]

    return None


def extract_patient_name(messages: list[dict[str, str]]) -> str | None:
    for message in reversed(messages):
        if message.get("role") != "user":
            continue
        content = message.get("content", "")
        match = NAME_RE.search(content)
        if match:
            return match.group(1).strip()
        words = content.strip().split()
        if 2 <= len(words) <= 4 and all(w[0].isupper() for w in words if w):
            if not any(ch.isdigit() for ch in content):
                return content.strip()
    return None


def extract_patient_phone(messages: list[dict[str, str]]) -> str | None:
    for message in reversed(messages):
        if message.get("role") != "user":
            continue
        match = PHONE_RE.search(message.get("content", ""))
        if match:
            return re.sub(r"\D", "", match.group(0))[-10:]
    return None
