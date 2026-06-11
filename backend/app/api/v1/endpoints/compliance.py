from fastapi import APIRouter, Depends

from app.core.security import get_tenant_id, get_user_id, require_owner
from app.schemas.compliance import BAAAcknowledgeResponse, BAAStatusResponse, ComplianceReportResponse
from app.services.compliance import acknowledge_tenant_baa, get_baa_status, get_compliance_report

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/baa/status", response_model=BAAStatusResponse)
async def baa_status(tenant_id: str = Depends(get_tenant_id)) -> BAAStatusResponse:
    """BAA compliance state for the signed-in tenant — use to verify production gating."""
    return await get_baa_status(tenant_id)


@router.post("/baa/acknowledge", response_model=BAAAcknowledgeResponse)
async def acknowledge_baa(
    tenant_id: str = Depends(get_tenant_id),
    user_id: str = Depends(get_user_id),
    _owner: dict = Depends(require_owner),
) -> BAAAcknowledgeResponse:
    await acknowledge_tenant_baa(tenant_id, user_id)
    status = await get_baa_status(tenant_id)
    return BAAAcknowledgeResponse(**status.model_dump())


@router.get("/report", response_model=ComplianceReportResponse)
async def compliance_report(
    tenant_id: str = Depends(get_tenant_id),
    _owner: dict = Depends(require_owner),
) -> ComplianceReportResponse:
    """Admin compliance summary — BAA status plus recent audit trail."""
    return await get_compliance_report(tenant_id)
