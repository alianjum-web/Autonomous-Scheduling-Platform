import json

from app.core.logging import PHI_FIELDS, configure_logging, get_logger, redact_phi_processor, scrub_phi_text


def test_scrub_phi_text_patterns():
    text = "Jane Doe jane@clinic.org 555-123-4567 SSN 123-45-6789 DOB 03/15/1990"
    scrubbed = scrub_phi_text(text)
    assert "jane@clinic.org" not in scrubbed
    assert "555-123-4567" not in scrubbed
    assert "123-45-6789" not in scrubbed
    assert "03/15/1990" not in scrubbed
    assert "[EMAIL_REDACTED]" in scrubbed
    assert "[PHONE_REDACTED]" in scrubbed


def test_redact_phi_processor_scrubs_fields():
    event = {
        "event": "Patient jane@clinic.org called",
        "patient_name": "Jane Doe",
        "patient_phone": "555-123-4567",
        "extra_data": {"ai_summary": "Chest pain", "count": 1},
    }
    result = redact_phi_processor(None, "info", event)
    assert result["patient_name"] == "[REDACTED]"
    assert result["patient_phone"] == "[REDACTED]"
    assert result["extra_data"]["ai_summary"] == "[REDACTED]"
    assert result["extra_data"]["count"] == 1
    assert "jane@clinic.org" not in result["event"]


def test_logger_emits_redacted_json(capsys):
    configure_logging()
    logger = get_logger("test.phi")
    logger.info(
        "Contact patient at jane@clinic.org",
        extra={"extra_data": {"patient_phone": "555-123-4567", "session_id": "abc"}},
    )

    captured = capsys.readouterr().out.strip()
    payload = json.loads(captured)
    assert "jane@clinic.org" not in captured
    assert "555-123-4567" not in captured
    assert payload["extra_data"]["patient_phone"] == "[REDACTED]"
    assert payload["extra_data"]["session_id"] == "abc"


def test_phi_fields_frozen_set():
    assert "patient_name" in PHI_FIELDS
    assert "chief_complaint" in PHI_FIELDS
