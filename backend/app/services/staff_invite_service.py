"""Staff invite workflows — owner invites, staff accepts after sign-in."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.adapters.resend_client import send_email
from app.core.config import Settings, get_settings
from app.core.logger import get_logger
from app.services import supabase_client

logger = get_logger(__name__)


class StaffInviteError(Exception):
    pass


def _row_invite(row: dict[str, Any], *, email_sent: bool = False) -> dict[str, str | bool | None]:
    return {
        "id": str(row["id"]),
        "email": str(row["email"]),
        "role": str(row["role"]),
        "token": str(row["token"]),
        "expires_at": str(row["expires_at"]),
        "accepted_at": str(row["accepted_at"]) if row.get("accepted_at") else None,
        "created_at": str(row["created_at"]),
        "email_sent": email_sent,
    }


async def list_invites(tenant_id: str) -> list[dict[str, str | bool | None]]:
    rows = await supabase_client.list_staff_invites(tenant_id)
    return [_row_invite(row) for row in rows]


async def create_invite(
    *,
    tenant_id: str,
    invited_by: str,
    email: str,
    role: str,
    settings: Settings | None = None,
) -> dict[str, str | bool | None]:
    settings = settings or get_settings()
    normalized_email = email.strip().lower()

    existing = await supabase_client.get_staff_invite_by_email(tenant_id, normalized_email)
    if existing and existing.get("accepted_at") is None:
        raise StaffInviteError("An active invite already exists for this email.")

    row = await supabase_client.create_staff_invite(
        tenant_id=tenant_id,
        email=normalized_email,
        role=role,
        invited_by=invited_by,
    )
    tenant = await supabase_client.get_tenant(tenant_id)
    clinic_name = str(tenant["name"]) if tenant else "your clinic"
    accept_url = f"{settings.frontend_origin}/accept-invite?token={row['token']}"

    html = f"""
    <p>You have been invited to join <strong>{clinic_name}</strong> on Symptra Scheduling as a {"doctor" if role == "doctor" else "clinic team member"}.</p>
    <p><a href="{accept_url}">Accept invitation</a></p>
    <p>This link expires in 7 days. Sign in with this email address to complete setup.</p>
    """
    text = (
        f"You have been invited to join {clinic_name} on Symptra Scheduling.\n"
        f"Accept: {accept_url}\n"
        "Sign in with this email address. Link expires in 7 days."
    )

    message_id = await send_email(
        to=normalized_email,
        subject=f"You're invited to {clinic_name} on Symptra",
        html=html,
        text=text,
    )
    if message_id:
        logger.info(
            "Staff invite email sent",
            extra={"extra_data": {"tenant_id": tenant_id, "email_domain": normalized_email.split("@")[-1]}},
        )
    else:
        logger.warning(
            "Staff invite created but email not sent — verify Resend domain or copy invite link manually",
            extra={"extra_data": {"tenant_id": tenant_id, "accept_url": accept_url}},
        )

    return _row_invite(row, email_sent=bool(message_id))


async def preview_invite(token: str) -> dict[str, str | bool]:
    row = await supabase_client.get_staff_invite_by_token(token)
    if row is None:
        raise StaffInviteError("Invite not found")

    tenant = await supabase_client.get_tenant(str(row["tenant_id"]))
    expires_at = row.get("expires_at")
    expired = bool(row.get("accepted_at"))
    if not expired and expires_at:
        if isinstance(expires_at, str):
            exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        else:
            exp = expires_at
        expired = exp <= datetime.now(timezone.utc)

    return {
        "clinic_name": str(tenant["name"]) if tenant else "Clinic",
        "email": str(row["email"]),
        "role": str(row["role"]),
        "expired": expired,
    }
