"""HIPAA BAA enforcement — blocks AI/PHI features until clinic acknowledges BAA."""

from __future__ import annotations

from app.core.config import get_settings
from app.core.feature_flags import get_feature_flags
from app.schemas.compliance import BAAStatusResponse, ComplianceAuditEntry, ComplianceReportResponse
from app.services import supabase_client

COMPLIANCE_AUDIT_ACTIONS = frozenset({
    "baa_acknowledged",
    "calendar_config_updated",
})


class BAARequiredError(Exception):
    """Tenant has not signed HIPAA BAA — AI features are disabled."""


def baa_enforcement_enabled() -> bool:
    """Production always enforces when BAA_ENFORCEMENT=true (see .env.production).

    Development can disable via feature-flags.json ``compliance.baa_enforcement: false``.
    Master kill-switch: set BAA_ENFORCEMENT=false in environment.
    """
    settings = get_settings()
    if not settings.baa_enforcement:
        return False

    if settings.environment == "production":
        return True

    flags = get_feature_flags()
    compliance = flags.features.compliance
    if compliance is not None:
        return compliance.baa_enforcement
    return True


async def tenant_has_baa(tenant_id: str) -> bool:
    tenant = await supabase_client.get_tenant(tenant_id)
    if tenant is None:
        return False
    return tenant.get("hipaa_baa_signed_at") is not None


async def get_baa_status(tenant_id: str) -> BAAStatusResponse:
    settings = get_settings()
    enforcement = baa_enforcement_enabled()
    signed = await tenant_has_baa(tenant_id)
    tenant = await supabase_client.get_tenant(tenant_id)
    signed_at = tenant.get("hipaa_baa_signed_at") if tenant else None
    return BAAStatusResponse(
        tenant_id=tenant_id,
        baa_signed=signed,
        signed_at=str(signed_at) if signed_at else None,
        enforcement_enabled=enforcement,
        environment=settings.environment,
        ai_features_available=signed or not enforcement,
    )


async def require_tenant_baa(tenant_id: str) -> None:
    if not baa_enforcement_enabled():
        return
    if not await tenant_has_baa(tenant_id):
        raise BAARequiredError(
            "HIPAA Business Associate Agreement required before using AI features. "
            "A clinic admin must acknowledge the BAA in Settings."
        )


async def acknowledge_tenant_baa(tenant_id: str, user_id: str) -> dict:
    if await tenant_has_baa(tenant_id):
        tenant = await supabase_client.get_tenant(tenant_id)
        return tenant or {}

    tenant = await supabase_client.acknowledge_tenant_baa(tenant_id, user_id)
    await supabase_client.insert_audit_log(
        tenant_id=tenant_id,
        actor_id=user_id,
        action="baa_acknowledged",
        resource_type="tenant",
        resource_id=tenant_id,
        metadata={"hipaa_baa_signed_at": tenant.get("hipaa_baa_signed_at")},
    )
    return tenant


async def get_compliance_report(tenant_id: str, *, audit_limit: int = 25) -> ComplianceReportResponse:
    baa = await get_baa_status(tenant_id)
    rows = await supabase_client.list_audit_logs(
        tenant_id,
        actions=list(COMPLIANCE_AUDIT_ACTIONS),
        limit=audit_limit,
    )
    recent_audit = [
        ComplianceAuditEntry(
            id=str(row["id"]),
            action=row["action"],
            actor_id=row.get("actor_id"),
            resource_type=row["resource_type"],
            resource_id=row["resource_id"],
            created_at=str(row["created_at"]),
            metadata=row.get("metadata") or {},
        )
        for row in rows
    ]
    return ComplianceReportResponse(baa=baa, recent_audit=recent_audit)
