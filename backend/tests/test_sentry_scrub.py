from app.core.sentry import scrub_event


def test_scrub_event_redacts_message_and_exceptions():
    event = {
        "message": "Failed for jane@clinic.org at 555-123-4567",
        "exception": {"values": [{"value": "patient_phone=555-987-6543"}]},
        "extra": {"patient_name": "Jane Doe", "request_id": "req-1"},
    }
    scrubbed = scrub_event(event, {})
    assert "jane@clinic.org" not in scrubbed["message"]
    assert "[EMAIL_REDACTED]" in scrubbed["message"]
    assert scrubbed["extra"]["patient_name"] == "[REDACTED]"
    assert scrubbed["extra"]["request_id"] == "req-1"
    assert "555-987-6543" not in scrubbed["exception"]["values"][0]["value"]
