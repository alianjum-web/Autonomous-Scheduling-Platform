"""PII redaction before chunk storage — SSN, DOB, patient names."""

from __future__ import annotations

import re
from typing import cast

from app.core.logger import get_logger

logger = get_logger(__name__)

_SSN_PATTERN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
_DOB_PATTERN = re.compile(
    r"\b(?:0[1-9]|1[0-2])[/-](?:0[1-9]|[12]\d|3[01])[/-](?:19|20)\d{2}\b"
)
_NAME_PATTERN = re.compile(r"\b(?:Patient|Mr\.|Mrs\.|Ms\.|Dr\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b")


def redact_pii(text: str) -> str:
    redacted = _SSN_PATTERN.sub("***-**-****", text)
    redacted = _DOB_PATTERN.sub("**/**/****", redacted)
    redacted = _NAME_PATTERN.sub("[REDACTED NAME]", redacted)

    try:
        from presidio_analyzer import AnalyzerEngine
        from presidio_anonymizer import AnonymizerEngine
        from presidio_anonymizer.entities import OperatorConfig
        from presidio_anonymizer.entities.engine.recognizer_result import RecognizerResult

        analyzer = AnalyzerEngine()
        anonymizer = AnonymizerEngine()
        results = analyzer.analyze(
            text=redacted, language="en", entities=["US_SSN", "DATE_TIME", "PERSON"]
        )
        if results:
            redacted = anonymizer.anonymize(
                text=redacted,
                analyzer_results=cast(list[RecognizerResult], results),
                operators={"DEFAULT": OperatorConfig("replace", {"new_value": "[REDACTED]"})},
            ).text
    except ImportError:
        pass
    except Exception as exc:
        logger.warning("Presidio redaction skipped", extra={"extra_data": {"error": str(exc)}})

    return redacted
