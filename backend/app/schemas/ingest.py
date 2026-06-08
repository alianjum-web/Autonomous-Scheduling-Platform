from __future__ import annotations

from pydantic import BaseModel

from app.schemas.db import ClinicDocumentRow


class DocumentListResponse(BaseModel):
    documents: list[ClinicDocumentRow]


class DocumentChunksResponse(BaseModel):
    chunks: list[dict]


class UploadDocumentResponse(BaseModel):
    job_id: str
    status: str
    filename: str


class DeleteDocumentResponse(BaseModel):
    deleted: str
