from fastapi import APIRouter, Depends

from app.core.security import get_tenant_id, get_user_id, require_admin
from app.services.compliance import acknowledge_tenant_baa, tenant_has_baa

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/baa/status")
async def baa_status(tenant_id: str = Depends(get_tenant_id)) -> dict:
    signed = await tenant_has_baa(tenant_id)
    return {"baa_signed": signed, "tenant_id": tenant_id}


@router.post("/baa/acknowledge")
async def acknowledge_baa(
    tenant_id: str = Depends(get_tenant_id),
    user_id: str = Depends(get_user_id),
    _admin: dict = Depends(require_admin),
) -> dict:
    tenant = await acknowledge_tenant_baa(tenant_id, user_id)
    return {
        "baa_signed": tenant.get("hipaa_baa_signed_at") is not None,
        "signed_at": tenant.get("hipaa_baa_signed_at"),
        "tenant_id": tenant_id,
    }
