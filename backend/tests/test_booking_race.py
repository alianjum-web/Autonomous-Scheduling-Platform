from unittest.mock import AsyncMock, patch

import pytest

from app.services.supabase_client import AppointmentConflictError


@pytest.mark.asyncio
async def test_booking_returns_409_when_lock_held(client, make_token, tenant_id):
    with patch("app.api.v1.endpoints.schedule.acquire_lock", AsyncMock(return_value=False)):
        token = make_token()
        response = client.post(
            "/v1/schedule/book",
            json={
                "slot_start": "2026-06-10T09:00:00Z",
                "patient_name": "Jane Doe",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 409
    assert "currently being booked" in response.json()["detail"]


@pytest.mark.asyncio
async def test_booking_returns_409_on_db_unique_violation(client, make_token, tenant_id):
    with (
        patch("app.api.v1.endpoints.schedule.acquire_lock", AsyncMock(return_value=True)),
        patch("app.api.v1.endpoints.schedule.release_lock", AsyncMock()),
        patch(
            "app.api.v1.endpoints.schedule.supabase_client.find_conflicting_appointment",
            AsyncMock(return_value=None),
        ),
        patch(
            "app.api.v1.endpoints.schedule.create_calendar_event",
            AsyncMock(return_value="cal-event-1"),
        ),
        patch(
            "app.api.v1.endpoints.schedule.delete_calendar_event",
            AsyncMock(),
        ) as mock_delete,
        patch(
            "app.api.v1.endpoints.schedule.supabase_client.create_appointment",
            AsyncMock(side_effect=AppointmentConflictError()),
        ),
    ):
        token = make_token()
        response = client.post(
            "/v1/schedule/book",
            json={
                "slot_start": "2026-06-10T09:00:00Z",
                "patient_name": "Jane Doe",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 409
    assert "no longer available" in response.json()["detail"]
    mock_delete.assert_awaited_once_with("cal-event-1")
