from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status

from app.core.config import Settings, get_settings
from app.core.security import get_tenant_id, get_user_id, require_admin
from app.services import supabase_client
from app.services.embedding import (
    DuplicateDocumentError,
    EmbeddingTimeoutError,
    compute_file_hash,
    ingest_document,
)

router = APIRouter(prefix="/ingest", tags=["ingest"])

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_CATEGORIES = {"treatment_protocol", "pricing", "insurance", "faq", "other"}


def _validate_file(filename: str, content_type: str | None) -> None:
    lower = filename.lower()
    if not any(lower.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF and DOCX files are accepted",
        )


@router.get("/documents")
async def list_documents(
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
):
    docs = await supabase_client.list_clinic_documents(tenant_id)
    return {"documents": docs}


@router.get("/documents/{document_id}/chunks")
async def get_document_chunks(
    document_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
):
    chunks = await supabase_client.get_document_chunks(document_id, tenant_id, limit=3)
    return {"chunks": chunks}


@router.post("/document")
async def upload_document(
    background_tasks: BackgroundTasks,
    category: str = Form(...),
    file: UploadFile = File(...),
    tenant_id: str = Depends(get_tenant_id),
    user_id: str = Depends(get_user_id),
    _admin: dict = Depends(require_admin),
    settings: Settings = Depends(get_settings),
):
    if category not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category")

    filename = file.filename or "document"
    _validate_file(filename, file.content_type)

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {settings.max_upload_bytes // (1024 * 1024)}MB",
        )
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")

    file_hash = compute_file_hash(file_bytes)

    existing = await supabase_client.find_document_by_hash(tenant_id, file_hash)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "Document already ingested", "document_id": existing["id"]},
        )

    job = await supabase_client.create_ingestion_job(
        tenant_id=tenant_id,
        filename=filename,
        category=category,
        file_hash=file_hash,
        ingested_by=user_id,
    )

    background_tasks.add_task(
        _run_ingestion,
        tenant_id,
        category,
        filename,
        file_bytes,
        user_id,
        job["id"],
    )

    return {"job_id": job["id"], "status": "processing", "filename": filename}


async def _run_ingestion(
    tenant_id: str,
    category: str,
    filename: str,
    file_bytes: bytes,
    user_id: str,
    job_id: str,
) -> None:
    try:
        await ingest_document(
            tenant_id=tenant_id,
            category=category,
            filename=filename,
            file_bytes=file_bytes,
            ingested_by=user_id,
            job_id=job_id,
        )
    except DuplicateDocumentError as exc:
        await supabase_client.update_ingestion_job(
            job_id,
            {"status": "failed", "error_message": f"Duplicate: {exc.filename}"},
        )
    except EmbeddingTimeoutError as exc:
        await supabase_client.update_ingestion_job(
            job_id,
            {
                "status": "partial",
                "chunks_done": exc.chunks_done,
                "error_message": str(exc),
            },
        )
    except Exception as exc:
        await supabase_client.update_ingestion_job(
            job_id,
            {"status": "failed", "error_message": str(exc)},
        )


@router.get("/status/{job_id}")
async def get_ingestion_status(
    job_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
):
    job = await supabase_client.get_ingestion_job(job_id, tenant_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


@router.delete("/document/{document_id}")
async def delete_document(
    document_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
):
    await supabase_client.delete_clinic_document(document_id, tenant_id)
    return {"deleted": document_id}
