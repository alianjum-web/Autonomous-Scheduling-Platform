"""HTTP middleware for request/correlation/tenant tracing."""

from __future__ import annotations

from jose import JWTError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import get_settings
from app.core.request_context import (
    CORRELATION_ID_HEADER,
    REQUEST_ID_HEADER,
    bind_request_context,
    clear_request_context,
    new_request_id,
)
from app.core.security import decode_jwt_token


def _tenant_id_from_auth_header(auth_header: str) -> str | None:
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.removeprefix("Bearer ").strip()
    if not token:
        return None
    try:
        payload = decode_jwt_token(token, get_settings())
    except JWTError:
        return None
    tenant_id = payload.get("tenant_id") or payload.get("app_metadata", {}).get("tenant_id")
    return str(tenant_id) if tenant_id else None


class RequestTracingMiddleware(BaseHTTPMiddleware):
    """Attach request/correlation/tenant IDs to every log line and response headers."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get(REQUEST_ID_HEADER) or new_request_id()
        correlation_id = request.headers.get(CORRELATION_ID_HEADER) or request_id
        tenant_id = _tenant_id_from_auth_header(request.headers.get("authorization", ""))

        bind_request_context(
            request_id=request_id,
            correlation_id=correlation_id,
            tenant_id=tenant_id,
        )
        try:
            response = await call_next(request)
            response.headers[REQUEST_ID_HEADER] = request_id
            response.headers[CORRELATION_ID_HEADER] = correlation_id
            return response
        finally:
            clear_request_context()
