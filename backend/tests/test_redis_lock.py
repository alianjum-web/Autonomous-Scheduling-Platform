from unittest.mock import AsyncMock, patch

import pytest

from app.adapters.redis_client import acquire_lock, release_lock


@pytest.mark.asyncio
async def test_acquire_lock_success():
    mock_redis = AsyncMock()
    mock_redis.set = AsyncMock(return_value=True)

    with patch("app.adapters.redis_client.get_redis", AsyncMock(return_value=mock_redis)):
        acquired = await acquire_lock("slot:tenant:provider:2026-06-10T09:00:00Z", ttl=30)

    assert acquired is True
    mock_redis.set.assert_awaited_once_with(
        "lock:slot:tenant:provider:2026-06-10T09:00:00Z",
        "1",
        nx=True,
        ex=30,
    )


@pytest.mark.asyncio
async def test_acquire_lock_contention():
    mock_redis = AsyncMock()
    mock_redis.set = AsyncMock(return_value=None)

    with patch("app.adapters.redis_client.get_redis", AsyncMock(return_value=mock_redis)):
        acquired = await acquire_lock("slot:tenant:provider:2026-06-10T09:00:00Z")

    assert acquired is False


@pytest.mark.asyncio
async def test_release_lock_deletes_key():
    mock_redis = AsyncMock()
    mock_redis.delete = AsyncMock()

    with patch("app.adapters.redis_client.get_redis", AsyncMock(return_value=mock_redis)):
        await release_lock("slot:tenant:provider:2026-06-10T09:00:00Z")

    mock_redis.delete.assert_awaited_once_with("lock:slot:tenant:provider:2026-06-10T09:00:00Z")
