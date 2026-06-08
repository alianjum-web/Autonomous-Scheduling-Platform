"""Document upload and ingestion job workflows."""

from __future__ import annotations

from dataclasses import dataclass

from app.schemas.db import ClinicDocumentRow, IngestionJobRow
from app.services import supabase_client
from app.services.embedding import (
    DuplicateDocumentError,
    EmbeddingTimeoutError,
    compute_file_hash,
    ingest_document,
)

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_CATEGORIES = {"treatment_protocol", "pricing", "insurance", "faq", "other"}


class InvalidCategoryError(Exception):
    """Document category is not allowed."""


class UnsupportedFileTypeError(Exception):
    """Only PDF and DOCX files are accepted."""


class FileTooLargeError(Exception):
    """Uploaded file exceeds the configured size limit."""

    def __init__(self, max_mb: int) -> None:
        self.max_mb = max_mb
        super().__init__(f"File exceeds maximum size of {max_mb}MB")


class EmptyFileError(Exception):
    """Uploaded file has no content."""


class DocumentAlreadyIngestedError(Exception):
    """A document with the same hash already exists."""

    def __init__(self, document_id: str) -> None:
        self.document_id = document_id
        super().__init__("Document already ingested")


class IngestionJobNotFoundError(Exception):
    """Ingestion job does not exist for this tenant."""


@dataclass
class UploadJobStarted:
    job_id: str
    status: str
    filename: str
    category: str
    file_bytes: bytes
    user_id: str


def validate_upload(filename: str, category: str, file_bytes: bytes, max_upload_bytes: int) -> None:
    if category not in ALLOWED_CATEGORIES:
        raise InvalidCategoryError()

    lower = filename.lower()
    if not any(lower.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise UnsupportedFileTypeError()

    if len(file_bytes) > max_upload_bytes:
        raise FileTooLargeError(max_upload_bytes // (1024 * 1024))

    if not file_bytes:
        raise EmptyFileError()


async def list_documents(tenant_id: str) -> list[ClinicDocumentRow]:
    return await supabase_client.list_clinic_documents(tenant_id)


async def get_document_chunks(document_id: str, tenant_id: str) -> list[dict]:
    return await supabase_client.get_document_chunks(document_id, tenant_id, limit=3)


async def start_document_upload(
    tenant_id: str,
    *,
    category: str,
    filename: str,
    file_bytes: bytes,
    user_id: str,
    max_upload_bytes: int,
) -> UploadJobStarted:
    validate_upload(filename, category, file_bytes, max_upload_bytes)

    file_hash = compute_file_hash(file_bytes)
    existing = await supabase_client.find_document_by_hash(tenant_id, file_hash)
    if existing:
        raise DocumentAlreadyIngestedError(existing["id"])

    job = await supabase_client.create_ingestion_job(
        tenant_id=tenant_id,
        filename=filename,
        category=category,
        file_hash=file_hash,
        ingested_by=user_id,
    )

    return UploadJobStarted(
        job_id=job["id"],
        status="processing",
        filename=filename,
        category=category,
        file_bytes=file_bytes,
        user_id=user_id,
    )


async def run_ingestion_job(
    tenant_id: str,
    *,
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


async def get_ingestion_status(job_id: str, tenant_id: str) -> IngestionJobRow:
    job = await supabase_client.get_ingestion_job(job_id, tenant_id)
    if job is None:
        raise IngestionJobNotFoundError()
    return job


async def delete_document(document_id: str, tenant_id: str) -> str:
    await supabase_client.delete_clinic_document(document_id, tenant_id)
    return document_id
