"""Ingest HTTP routes — delegates all workflows to ingestion_service."""

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile

from app.core.config import Settings, get_settings
from app.core.security import get_tenant_id, get_user_id, require_admin
from app.schemas.ingest import (
    DeleteDocumentResponse,
    DocumentChunksResponse,
    DocumentListResponse,
    UploadDocumentResponse,
)
from app.services import ingestion_service

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
) -> DocumentListResponse:
    documents = await ingestion_service.list_documents(tenant_id)
    return DocumentListResponse(documents=documents)


@router.get("/documents/{document_id}/chunks", response_model=DocumentChunksResponse)
async def get_document_chunks(
    document_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
) -> DocumentChunksResponse:
    chunks = await ingestion_service.get_document_chunks(document_id, tenant_id)
    return DocumentChunksResponse(chunks=chunks)


@router.post("/document", response_model=UploadDocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    category: str = Form(...),
    file: UploadFile = File(...),
    tenant_id: str = Depends(get_tenant_id),
    user_id: str = Depends(get_user_id),
    _admin: dict = Depends(require_admin),
    settings: Settings = Depends(get_settings),
) -> UploadDocumentResponse:
    file_bytes = await file.read()
    job = await ingestion_service.start_document_upload(
        tenant_id,
        category=category,
        filename=file.filename or "document",
        file_bytes=file_bytes,
        user_id=user_id,
        max_upload_bytes=settings.max_upload_bytes,
    )

    background_tasks.add_task(
        ingestion_service.run_ingestion_job,
        tenant_id,
        category=job.category,
        filename=job.filename,
        file_bytes=job.file_bytes,
        user_id=job.user_id,
        job_id=job.job_id,
    )

    return UploadDocumentResponse(job_id=job.job_id, status=job.status, filename=job.filename)


@router.get("/status/{job_id}")
async def get_ingestion_status(
    job_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
):
    return await ingestion_service.get_ingestion_status(job_id, tenant_id)


@router.delete("/document/{document_id}", response_model=DeleteDocumentResponse)
async def delete_document(
    document_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
) -> DeleteDocumentResponse:
    deleted = await ingestion_service.delete_document(document_id, tenant_id)
    return DeleteDocumentResponse(deleted=deleted)
