"""Short-lived guest tokens for public patient triage (no workspace membership)."""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.core.config import Settings

GUEST_TOKEN_TYPE = "guest_visit"


def create_guest_token(settings: Settings, *, tenant_id: str, session_id: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(hours=4)
    payload = {
        "typ": GUEST_TOKEN_TYPE,
        "tenant_id": tenant_id,
        "session_id": session_id,
        "exp": expires,
    }
    return jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")


def decode_guest_token(settings: Settings, token: str) -> dict[str, str]:
    try:
        payload = jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"])
    except JWTError as exc:
        raise ValueError("Invalid guest token") from exc

    if payload.get("typ") != GUEST_TOKEN_TYPE:
        raise ValueError("Invalid guest token type")

    tenant_id = payload.get("tenant_id")
    session_id = payload.get("session_id")
    if not tenant_id or not session_id:
        raise ValueError("Guest token missing scope")

    return {"tenant_id": str(tenant_id), "session_id": str(session_id)}
