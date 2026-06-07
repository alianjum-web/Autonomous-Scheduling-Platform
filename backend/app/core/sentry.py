from __future__ import annotations

from app.core.logging import redact_value, scrub_phi_text


def scrub_event(event: dict, _hint: dict) -> dict | None:
    if "message" in event and isinstance(event["message"], str):
        event["message"] = scrub_phi_text(event["message"])
    if "extra" in event and isinstance(event["extra"], dict):
        event["extra"] = redact_value(event["extra"])
    if "exception" in event:
        for exc in event.get("exception", {}).get("values", []):
            if "value" in exc and isinstance(exc["value"], str):
                exc["value"] = scrub_phi_text(exc["value"])
    if "breadcrumbs" in event:
        for crumb in event.get("breadcrumbs", {}).get("values", []):
            if "message" in crumb and isinstance(crumb["message"], str):
                crumb["message"] = scrub_phi_text(crumb["message"])
    return event


def init_sentry(dsn: str, environment: str) -> None:
    if not dsn:
        return
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration

    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        integrations=[FastApiIntegration()],
        before_send=scrub_event,
        send_default_pii=False,
        traces_sample_rate=0.1,
    )
