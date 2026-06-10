import pytest

from app.services.booking_intent import (
    extract_patient_name,
    extract_patient_phone,
    looks_like_name,
    match_slot_from_message,
)


def test_match_slot_single_confirm():
    slot = "2026-06-15T14:00:00+00:00"
    assert match_slot_from_message("Yes, that works for me", [slot]) == slot


def test_match_slot_by_weekday():
    slot = "2026-06-15T14:00:00+00:00"
    assert match_slot_from_message("Monday at 2pm works", [slot]) is not None


def test_looks_like_name_bare():
    assert looks_like_name("Jane Smith") is True
    assert looks_like_name("what is insurance") is False


def test_match_slot_by_iso_fragment():
    slot = "2026-06-15T14:00:00+00:00"
    assert match_slot_from_message(slot, [slot]) == slot


def test_extract_patient_name_from_phrase():
    messages = [{"role": "user", "content": "My name is Jane Smith"}]
    assert extract_patient_name(messages) == "Jane Smith"


def test_extract_patient_phone():
    messages = [{"role": "user", "content": "You can reach me at (555) 123-4567"}]
    assert extract_patient_phone(messages) == "5551234567"


@pytest.mark.asyncio
async def test_booking_executor_asks_for_name():
    from app.services.agent import booking_executor

    state = await booking_executor({
        "session_id": "s1",
        "tenant_id": "t1",
        "latest_user_message": "Yes book it",
        "messages": [{"role": "user", "content": "Yes book it"}],
        "available_slots": ["2026-06-15T14:00:00+00:00"],
    })
    assert state["booking_confirmed"] is False
    assert "name" in state["final_response"].lower()


@pytest.mark.asyncio
async def test_booking_executor_confirms(monkeypatch: pytest.MonkeyPatch):
    from app.schemas.schedule import BookResponse
    from app.services.agent import booking_executor

    async def fake_book(_tenant_id: str, _request):
        return BookResponse(
            appointment={
                "id": "a1",
                "tenant_id": "t1",
                "patient_name": "Jane Smith",
                "slot_start": "2026-06-15T14:00:00+00:00",
                "slot_end": "2026-06-15T14:30:00+00:00",
                "confirmation_code": "ABCD1234",
                "status": "confirmed",
                "created_at": "2026-06-15T12:00:00+00:00",
            },
            confirmation_code="ABCD1234",
            slot_start="2026-06-15T14:00:00+00:00",
            slot_end="2026-06-15T14:30:00+00:00",
            status="confirmed",
        )

    monkeypatch.setattr("app.services.agent.book_appointment", fake_book)

    state = await booking_executor({
        "session_id": "s1",
        "tenant_id": "t1",
        "latest_user_message": "Yes confirm",
        "messages": [
            {"role": "user", "content": "My name is Jane Smith"},
            {"role": "user", "content": "Yes confirm"},
        ],
        "available_slots": ["2026-06-15T14:00:00+00:00"],
        "selected_slot": "2026-06-15T14:00:00+00:00",
    })
    assert state["booking_confirmed"] is True
    assert state["confirmation_code"] == "ABCD1234"
