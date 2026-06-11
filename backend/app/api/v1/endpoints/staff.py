"""Staff invite routes — owners invite doctors; doctors manage availability."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.config import Settings, get_settings
from app.core.security import get_tenant_id, get_user_id, require_doctor, require_owner, require_staff
from app.schemas.staff import (
    ProviderAvailabilityRequest,
    ProviderListResponse,
    ProviderResponse,
    StaffInviteCreateRequest,
    StaffInviteListResponse,
    StaffInvitePreviewResponse,
    StaffInviteResponse,
)
from app.services import provider_service, staff_invite_service
from app.services.provider_service import ProviderError
from app.services.staff_invite_service import StaffInviteError

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("/invites", response_model=StaffInviteListResponse)
async def list_staff_invites(
    tenant_id: str = Depends(get_tenant_id),
    _owner: dict = Depends(require_owner),
) -> StaffInviteListResponse:
    invites = await staff_invite_service.list_invites(tenant_id)
    return StaffInviteListResponse(
        invites=[StaffInviteResponse.model_validate(item) for item in invites],
    )


@router.post("/invites", response_model=StaffInviteResponse, status_code=status.HTTP_201_CREATED)
async def create_staff_invite(
    body: StaffInviteCreateRequest,
    tenant_id: str = Depends(get_tenant_id),
    user_id: str = Depends(get_user_id),
    settings: Settings = Depends(get_settings),
    _owner: dict = Depends(require_owner),
) -> StaffInviteResponse:
    try:
        invite = await staff_invite_service.create_invite(
            tenant_id=tenant_id,
            invited_by=user_id,
            email=body.email,
            role=body.role,
            settings=settings,
        )
    except StaffInviteError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return StaffInviteResponse.model_validate(invite)


@router.get("/invites/preview", response_model=StaffInvitePreviewResponse)
async def preview_staff_invite(
    token: str = Query(..., min_length=8),
) -> StaffInvitePreviewResponse:
    try:
        preview = await staff_invite_service.preview_invite(token)
    except StaffInviteError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return StaffInvitePreviewResponse.model_validate(preview)


@router.get("/doctors", response_model=ProviderListResponse)
async def list_doctors(
    tenant_id: str = Depends(get_tenant_id),
    _staff: dict = Depends(require_staff),
) -> ProviderListResponse:
    doctors = await provider_service.list_doctors(tenant_id)
    return ProviderListResponse(
        providers=[ProviderResponse.model_validate(item) for item in doctors],
    )


@router.delete("/doctors/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_doctor(
    profile_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _owner: dict = Depends(require_owner),
) -> None:
    try:
        await provider_service.remove_doctor(tenant_id, profile_id)
    except ProviderError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/doctors/me", response_model=ProviderResponse)
async def get_my_provider(
    user_id: str = Depends(get_user_id),
    _doctor: dict = Depends(require_doctor),
) -> ProviderResponse:
    try:
        provider = await provider_service.get_my_provider(user_id)
    except ProviderError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return ProviderResponse.model_validate(provider)


@router.put("/doctors/me/availability", response_model=ProviderResponse)
async def update_my_availability(
    body: ProviderAvailabilityRequest,
    user_id: str = Depends(get_user_id),
    _doctor: dict = Depends(require_doctor),
) -> ProviderResponse:
    try:
        provider = await provider_service.update_my_availability(
            user_id,
            availability_start=body.availability_start,
            availability_end=body.availability_end,
            slot_duration_minutes=body.slot_duration_minutes,
            specialty=body.specialty,
        )
    except ProviderError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return ProviderResponse.model_validate(provider)
