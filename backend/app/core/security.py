from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from app.core.config import Settings, get_settings
from app.core.jwt_verify import decode_supabase_jwt

security_scheme = HTTPBearer(auto_error=False)

ADMIN_ROLES = frozenset({"admin", "clinic_admin"})


def decode_jwt_token(token: str, settings: Settings) -> dict:
    return decode_supabase_jwt(token, settings)


def _extract_payload(
    credentials: HTTPAuthorizationCredentials | None,
    settings: Settings,
) -> dict:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        )
    try:
        return decode_jwt_token(credentials.credentials, settings)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid bearer token",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        ) from exc


async def get_jwt_payload(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    return _extract_payload(credentials, settings)


async def get_tenant_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> str:
    payload = _extract_payload(credentials, settings)
    tenant_id = payload.get("tenant_id") or payload.get("app_metadata", {}).get("tenant_id")
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token missing tenant_id claim",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        )
    return str(tenant_id)


async def get_user_id(payload: Annotated[dict, Depends(get_jwt_payload)]) -> str:
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token missing user id")
    return str(user_id)


def _get_clinic_role(payload: dict) -> str | None:
    return payload.get("clinic_role") or payload.get("app_metadata", {}).get("role")


async def get_clinic_role(payload: Annotated[dict, Depends(get_jwt_payload)]) -> str | None:
    return _get_clinic_role(payload)

# Annotated helps attach metadata to a type (payload is a dict); variable = Annotated[type_varible, data_variable]
async def require_admin(
    payload: Annotated[dict, Depends(get_jwt_payload)], 
) -> dict:
    role = _get_clinic_role(payload)
    if role not in ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return payload