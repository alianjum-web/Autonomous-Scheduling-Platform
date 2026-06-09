from unittest.mock import AsyncMock, patch

import pytest

from app.services.compliance import BAARequiredError, require_tenant_baa


@pytest.mark.asyncio
async def test_require_tenant_baa_skipped_when_disabled(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr("app.services.compliance.baa_enforcement_enabled", lambda: False)
    await require_tenant_baa("tenant-1")


@pytest.mark.asyncio
async def test_require_tenant_baa_raises_when_unsigned(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr("app.services.compliance.baa_enforcement_enabled", lambda: True)
    with patch(
        "app.services.compliance.tenant_has_baa",
        new=AsyncMock(return_value=False),
    ):
        with pytest.raises(BAARequiredError):
            await require_tenant_baa("tenant-1")


def test_baa_status_endpoint(client, make_token):
    with patch(
        "app.api.v1.endpoints.compliance.tenant_has_baa",
        new=AsyncMock(return_value=True),
    ):
        response = client.get(
            "/v1/compliance/baa/status",
            headers={"Authorization": f"Bearer {make_token(clinic_role='admin')}"},
        )
    assert response.status_code == 200
    assert response.json()["baa_signed"] is True
