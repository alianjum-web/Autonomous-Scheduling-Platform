"""HTTP streaming helpers shared by route modules."""

from __future__ import annotations

from collections.abc import AsyncIterator

from fastapi import Request
from fastapi.responses import StreamingResponse

SSE_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}


def sse_response(request: Request, stream: AsyncIterator[str]) -> StreamingResponse:
    """Wrap an async SSE chunk iterator with disconnect awareness."""

    async def event_generator():
        async for chunk in stream:
            if await request.is_disconnected():
                break
            yield chunk

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )
