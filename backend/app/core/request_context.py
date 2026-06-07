"""Per-request tracing context (request ID, correlation ID, tenant ID)."""

from __future__ import annotations

import contextvars
from uuid import uuid4

import structlog.contextvars

request_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar("request_id", default=None)
correlation_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar("correlation_id", default=None)
tenant_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar("tenant_id", default=None)

REQUEST_ID_HEADER = "X-Request-ID"
CORRELATION_ID_HEADER = "X-Correlation-ID"


def new_request_id() -> str:
    return str(uuid4())


def bind_request_context(
    *,
    request_id: str | None = None,
    correlation_id: str | None = None,
    tenant_id: str | None = None,
) -> str:
    """Bind tracing IDs to structlog contextvars; returns the request ID."""
    rid = request_id or new_request_id()
    cid = correlation_id or rid

    structlog.contextvars.clear_contextvars()
    context: dict[str, str] = {"request_id": rid, "correlation_id": cid}
    if tenant_id:
        context["tenant_id"] = tenant_id
    structlog.contextvars.bind_contextvars(**context)

    request_id_var.set(rid)
    correlation_id_var.set(cid)
    tenant_id_var.set(tenant_id)
    return rid


def clear_request_context() -> None:
    structlog.contextvars.clear_contextvars()
    request_id_var.set(None)
    correlation_id_var.set(None)
    tenant_id_var.set(None)


def get_request_id() -> str | None:
    return request_id_var.get()


def get_correlation_id() -> str | None:
    return correlation_id_var.get()


def get_tenant_id_from_context() -> str | None:
    return tenant_id_var.get()
