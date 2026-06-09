"""HIPAA BAA enforcement — blocks AI/PHI features until clinic acknowledges BAA."""

from __future__ import annotations

from app.core.config import get_settings
from app.core.feature_flags import get_feature_flags
from app.services import supabase_client


class BAARequiredError(Exception):
    """Tenant has not signed HIPAA BAA — AI features are disabled."""


def baa_enforcement_enabled() -> bool:
    flags = get_feature_flags()
    compliance = flags.features.compliance
    if compliance is not None:
        return compliance.baa_enforcement
    return get_settings().baa_enforcement


async def tenant_has_baa(tenant_id: str) -> bool:
    tenant = await supabase_client.get_tenant(tenant_id)
    if tenant is None:
        return False
    return tenant.get("hipaa_baa_signed_at") is not None


async def require_tenant_baa(tenant_id: str) -> None:
    if not baa_enforcement_enabled():
        return
    if not await tenant_has_baa(tenant_id):
        raise BAARequiredError(
            "HIPAA Business Associate Agreement required before using AI features. "
            "A clinic admin must acknowledge the BAA in Settings."
        )


async def acknowledge_tenant_baa(tenant_id: str, user_id: str) -> dict:
    return await supabase_client.acknowledge_tenant_baa(tenant_id, user_id)
