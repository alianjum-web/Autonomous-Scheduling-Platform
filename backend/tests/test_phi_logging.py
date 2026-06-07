import json
import re

import pytest

from app.core.logging import (
    LLM_CONTENT_FIELDS,
    PHI_FIELDS,
    configure_logging,
    get_logger,
    redact_phi_processor,
    redact_value,
    scrub_phi_text,
)
from app.core.request_context import bind_request_context, clear_request_context


PHI_VALUE_PATTERNS = [
    re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"),
    re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    re.compile(r"\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}"),
]


def _assert_no_raw_phi_in_json(payload: str) -> None:
    for pattern in PHI_VALUE_PATTERNS:
        assert not pattern.search(payload), f"Raw PHI pattern found: {pattern.pattern}"


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
    assert result["_log_policy"]["retention_days"] == 30
    assert result["_log_policy"]["access"] == "restricted_ops"


@pytest.mark.parametrize("field", sorted(LLM_CONTENT_FIELDS))
def test_llm_content_fields_always_redacted(field: str):
    event = {
        "event": "llm call",
        field: "Patient reports chest pain and takes metoprolol",
        "extra_data": {field: [{"role": "user", "content": "I have a headache"}]},
    }
    result = redact_phi_processor(None, "info", event)
    assert result[field] == "[LLM_CONTENT_REDACTED]"
    assert result["extra_data"][field] == "[LLM_CONTENT_REDACTED]"


def test_redact_value_scrubs_nested_strings():
    payload = {
        "nested": {"note": "reach jane@clinic.org", "items": ["555-123-4567"]},
        "messages": [{"role": "user", "content": "secret"}],
    }
    result = redact_value(payload)
    assert result["nested"]["note"] == "reach [EMAIL_REDACTED]"
    assert result["nested"]["items"] == ["[PHONE_REDACTED]"]
    assert result["messages"] == "[LLM_CONTENT_REDACTED]"


def test_logger_emits_redacted_json(capsys):
    configure_logging()
    logger = get_logger("test.phi")
    logger.info(
        "Contact patient at jane@clinic.org",
        extra={"extra_data": {"patient_phone": "555-123-4567", "session_id": "abc"}},
    )

    captured = capsys.readouterr().out.strip()
    payload = json.loads(captured)
    _assert_no_raw_phi_in_json(captured)
    assert payload["extra_data"]["patient_phone"] == "[REDACTED]"
    assert payload["extra_data"]["session_id"] == "abc"


def test_logger_blocks_raw_llm_prompt_and_response(capsys):
    configure_logging()
    logger = get_logger("test.llm")
    logger.warning(
        "LLM call failed",
        extra={
            "extra_data": {
                "prompt": "Summarize: patient has diabetes",
                "llm_response": "The patient should schedule a follow-up",
                "messages": [{"role": "user", "content": "I feel dizzy"}],
                "error": "timeout",
            }
        },
    )

    captured = capsys.readouterr().out.strip()
    payload = json.loads(captured)
    assert "diabetes" not in captured
    assert "dizzy" not in captured
    assert payload["extra_data"]["prompt"] == "[LLM_CONTENT_REDACTED]"
    assert payload["extra_data"]["llm_response"] == "[LLM_CONTENT_REDACTED]"
    assert payload["extra_data"]["messages"] == "[LLM_CONTENT_REDACTED]"
    assert payload["extra_data"]["error"] == "timeout"


def test_logger_includes_tracing_context(capsys):
    configure_logging()
    bind_request_context(
        request_id="req-abc",
        correlation_id="corr-xyz",
        tenant_id="tenant-111",
    )
    try:
        logger = get_logger("test.trace")
        logger.info("request handled")
        captured = capsys.readouterr().out.strip()
        payload = json.loads(captured)
        assert payload["request_id"] == "req-abc"
        assert payload["correlation_id"] == "corr-xyz"
        assert payload["tenant_id"] == "tenant-111"
    finally:
        clear_request_context()


def test_phi_fields_frozen_set():
    assert "patient_name" in PHI_FIELDS
    assert "chief_complaint" in PHI_FIELDS
    assert "prompt" in LLM_CONTENT_FIELDS
