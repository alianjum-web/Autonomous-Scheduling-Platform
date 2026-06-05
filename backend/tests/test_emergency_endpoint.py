from unittest.mock import AsyncMock, patch

import pytest


@pytest.mark.asyncio
async def test_emergency_bypasses_agent(client, make_token, tenant_id):
    session_id = "33333333-3333-3333-3333-333333333333"

    async def mock_get_session(sid, tid):
        if sid == session_id and tid == tenant_id:
            return {"id": session_id, "tenant_id": tid, "status": "active", "message_history": []}
        return None

    with (
        patch("app.api.v1.endpoints.triage.supabase_client.get_patient_session", mock_get_session),
        patch("app.api.v1.endpoints.triage.supabase_client.flag_emergency_session", AsyncMock()),
        patch("app.api.v1.endpoints.triage.run_triage_agent") as mock_agent,
        patch("app.api.v1.endpoints.triage.check_session_rate_limit", AsyncMock(return_value=True)),
    ):
        token = make_token()
        response = client.post(
            f"/v1/triage/message/{session_id}",
            json={"message": "I have chest pain and cannot breathe"},
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    mock_agent.assert_not_called()
    body = response.text
    assert "911" in body
    assert "cannot provide medical advice" in body
