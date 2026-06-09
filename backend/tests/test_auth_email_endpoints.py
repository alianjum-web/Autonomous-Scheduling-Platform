from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient


def test_resend_verification_rate_limited_returns_429(client: TestClient):
    with patch(
        "app.api.v1.endpoints.auth.auth_email_service.resend_verification_email",
        AsyncMock(return_value=(False, "Please wait before requesting another email.", 42)),
    ):
        response = client.post(
            "/v1/auth/resend-verification",
            json={
                "email": "user@example.com",
                "email_redirect_to": "http://localhost:3000/auth/callback",
            },
        )

    assert response.status_code == 429
    assert response.headers.get("Retry-After") == "42"
    body = response.json()
    assert body["detail"]["retry_after_seconds"] == 42


def test_forgot_password_success(client: TestClient):
    with patch(
        "app.api.v1.endpoints.auth.auth_email_service.send_password_reset_email",
        AsyncMock(return_value=(True, "Check your inbox for a password reset link.", 0)),
    ):
        response = client.post(
            "/v1/auth/forgot-password",
            json={
                "email": "user@example.com",
                "redirect_to": "http://localhost:3000/auth/callback?next=/reset-password",
            },
        )

    assert response.status_code == 200
    assert response.json()["ok"] is True
