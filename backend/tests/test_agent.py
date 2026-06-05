import pytest

from app.services.agent import intent_classifier
from app.services.emergency_keywords import (
    DEFAULT_PATTERNS,
    EMERGENCY_LEGAL_DISCLAIMER,
    detect_emergency,
    get_emergency_response,
)


@pytest.mark.parametrize(
    "message",
    ["I have chest pain", "call 911 now", "cannot breathe", "having a stroke"],
)
def test_emergency_regex_matches(message):
    assert detect_emergency(message)


@pytest.mark.parametrize("message", ["I need to book an appointment", "what are your hours?"])
def test_emergency_regex_no_match(message):
    assert not detect_emergency(message)


def test_emergency_response_includes_legal_disclaimer():
    assert EMERGENCY_LEGAL_DISCLAIMER in get_emergency_response()
    assert "911" in get_emergency_response()


def test_default_patterns_not_empty():
    assert len(DEFAULT_PATTERNS) >= 10


@pytest.mark.asyncio
async def test_intent_classifier_booking():
    state = await intent_classifier({
        "session_id": "s1",
        "tenant_id": "t1",
        "latest_user_message": "I want to book an appointment next week",
        "messages": [],
    })
    assert state["intent"] == "booking_request"


@pytest.mark.asyncio
async def test_intent_classifier_escalation():
    state = await intent_classifier({
        "session_id": "s1",
        "tenant_id": "t1",
        "latest_user_message": "I need to speak to a human staff member",
        "messages": [],
    })
    assert state["intent"] == "escalation"
