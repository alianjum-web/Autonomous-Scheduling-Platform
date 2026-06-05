from unittest.mock import AsyncMock, patch

import pytest


async def _mock_agent_stream(*_args, **_kwargs):
    yield "Hello "
    yield "there "
    yield {"available_slots": [], "should_escalate": False, "is_emergency": False, "intent": "faq"}


@pytest.mark.asyncio
async def test_sse_streams_tokens(client, make_token, tenant_id):
    session_id = "22222222-2222-2222-2222-222222222222"

    async def mock_get_session(sid, tid):
        if sid == session_id and tid == tenant_id:
            return {"id": session_id, "tenant_id": tid, "status": "active", "message_history": []}
        return None

    with (
        patch("app.api.v1.endpoints.triage.supabase_client.get_patient_session", mock_get_session),
        patch("app.api.v1.endpoints.triage.run_triage_agent", _mock_agent_stream),
        patch("app.api.v1.endpoints.triage.check_session_rate_limit", AsyncMock(return_value=True)),
    ):
        token = make_token()
        response = client.get(
            f"/v1/triage/stream/{session_id}",
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")

    body = response.text
    data_lines = [line for line in body.split("\n") if line.startswith("data: ")]
    assert len(data_lines) >= 2
    assert data_lines[-1] == "data: [DONE]"
