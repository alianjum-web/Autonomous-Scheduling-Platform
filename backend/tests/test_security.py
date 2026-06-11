from unittest.mock import AsyncMock, MagicMock, patch

import pytest


def test_missing_token_returns_403(client):
    response = client.post("/v1/triage/session", json={})
    assert response.status_code == 403
    assert response.headers.get("www-authenticate") == 'Bearer error="invalid_token"'


def test_invalid_token_returns_403(client, make_token):
    response = client.post(
        "/v1/triage/session",
        json={},
        headers={"Authorization": f"Bearer {make_token(invalid=True)}"},
    )
    assert response.status_code == 403
    assert response.headers.get("www-authenticate") == 'Bearer error="invalid_token"'


def test_empty_tenant_id_returns_403(client, make_token):
    with patch(
        "app.core.security.supabase_client.get_profile_tenant_id",
        new=AsyncMock(return_value=None),
    ):
        response = client.post(
            "/v1/triage/session",
            json={},
            headers={"Authorization": f"Bearer {make_token(tenant=None)}"},
        )
    assert response.status_code == 403
    data = response.json()
    assert data["detail"]["code"] == "tenant_required"


@pytest.mark.asyncio
async def test_tenant_id_resolved_from_profile_when_missing_in_jwt(client, make_token, tenant_id):
    with patch(
        "app.core.security.supabase_client.get_profile_tenant_id",
        new=AsyncMock(return_value=tenant_id),
    ), patch(
        "app.api.v1.endpoints.triage.require_tenant_baa",
        new=AsyncMock(),
    ), patch(
        "app.api.v1.endpoints.triage.triage_service.create_session",
        new=AsyncMock(return_value=MagicMock(session_id="sess-1", status="active")),
    ):
        response = client.post(
            "/v1/triage/session",
            json={},
            headers={"Authorization": f"Bearer {make_token(tenant=None)}"},
        )
    assert response.status_code == 200
