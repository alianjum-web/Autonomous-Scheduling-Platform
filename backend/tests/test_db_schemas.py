from app.schemas.db import AppointmentRow, ChatMessage, PatientSessionRow


def test_patient_session_row_typed_keys():
    session: PatientSessionRow = {
        "id": "sess-1",
        "tenant_id": "tenant-1",
        "status": "active",
        "metadata": {},
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
        "message_history": [{"role": "user", "content": "hello"}],
    }
    assert session["status"] == "active"
    assert session["message_history"][0]["role"] == "user"


def test_appointment_row_status_literal():
    appt: AppointmentRow = {
        "id": "appt-1",
        "tenant_id": "tenant-1",
        "patient_name": "Jane Doe",
        "slot_start": "2026-01-01T10:00:00Z",
        "slot_end": "2026-01-01T10:30:00Z",
        "confirmation_code": "ABC123",
        "status": "confirmed",
        "created_at": "2026-01-01T00:00:00Z",
    }
    assert appt["confirmation_code"] == "ABC123"


def test_chat_message_roles():
    msg: ChatMessage = {"role": "assistant", "content": "How can I help?"}
    assert msg["content"] == "How can I help?"
