from unittest.mock import AsyncMock, patch

import pytest

from app.services.auth_email_rate_limiter import (
    EMAIL_COOLDOWN_SECONDS,
    acquire_email_slot,
    check_ip_limit,
)


@pytest.mark.asyncio
async def test_acquire_email_slot_blocks_repeat_within_cooldown():
    mock_redis = AsyncMock()
    mock_redis.set = AsyncMock(side_effect=[True, None])
    mock_redis.ttl = AsyncMock(return_value=EMAIL_COOLDOWN_SECONDS - 5)

    with patch("app.services.auth_email_rate_limiter.get_redis", AsyncMock(return_value=mock_redis)):
        allowed_first, _ = await acquire_email_slot("resend", "User@Example.com")
        allowed_second, retry_after = await acquire_email_slot("resend", "user@example.com")

    assert allowed_first is True
    assert allowed_second is False
    assert retry_after == EMAIL_COOLDOWN_SECONDS - 5


@pytest.mark.asyncio
async def test_check_ip_limit_allows_under_threshold():
    mock_redis = AsyncMock()
    mock_redis.incr = AsyncMock(return_value=1)
    mock_redis.expire = AsyncMock()

    with patch("app.services.auth_email_rate_limiter.get_redis", AsyncMock(return_value=mock_redis)):
        allowed, retry_after = await check_ip_limit("signup", "203.0.113.10")

    assert allowed is True
    assert retry_after == 0
    mock_redis.expire.assert_awaited_once()


@pytest.mark.asyncio
async def test_check_ip_limit_blocks_over_threshold():
    mock_redis = AsyncMock()
    mock_redis.incr = AsyncMock(return_value=11)
    mock_redis.expire = AsyncMock()
    mock_redis.ttl = AsyncMock(return_value=1200)

    with patch("app.services.auth_email_rate_limiter.get_redis", AsyncMock(return_value=mock_redis)):
        allowed, retry_after = await check_ip_limit("signup", "203.0.113.10")

    assert allowed is False
    assert retry_after == 1200
