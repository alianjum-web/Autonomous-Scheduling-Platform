"""Account settings — workspace metadata for the authenticated clinic."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_tenant_id, require_staff
from app.schemas.settings import WorkspaceResponse
from app.services import supabase_client

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/workspace", response_model=WorkspaceResponse)
async def get_workspace(
    tenant_id: str = Depends(get_tenant_id),
    _staff: dict = Depends(require_staff),
) -> WorkspaceResponse:
    """Clinic name + slug via service role — avoids Supabase RLS on tenant embed joins."""
    tenant = await supabase_client.get_tenant(tenant_id)
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    return WorkspaceResponse(
        name=str(tenant.get("name") or ""),
        slug=str(tenant.get("slug") or ""),
    )
