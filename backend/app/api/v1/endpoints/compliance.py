from fastapi import APIRouter, Depends

from app.core.security import get_tenant_id, get_user_id, require_admin
from app.schemas.compliance import BAAAcknowledgeResponse, BAAStatusResponse
from app.services.compliance import acknowledge_tenant_baa, get_baa_status

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/baa/status", response_model=BAAStatusResponse)
async def baa_status(tenant_id: str = Depends(get_tenant_id)) -> BAAStatusResponse:
    """BAA compliance state for the signed-in tenant — use to verify production gating."""
    return await get_baa_status(tenant_id)


@router.post("/baa/acknowledge", response_model=BAAAcknowledgeResponse)
async def acknowledge_baa(
    tenant_id: str = Depends(get_tenant_id),
    user_id: str = Depends(get_user_id),
    _admin: dict = Depends(require_admin),
) -> BAAAcknowledgeResponse:
    await acknowledge_tenant_baa(tenant_id, user_id)
    status = await get_baa_status(tenant_id)
    return BAAAcknowledgeResponse(**status.model_dump())
