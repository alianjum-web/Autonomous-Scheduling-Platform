from __future__ import annotations

import asyncio
import hashlib
import io
from typing import Any

import pypdf
from docx import Document as DocxDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.adapters.llm import embed_texts, is_embedding_available
from app.core.config import get_settings
from app.core.logger import get_logger
from app.services import supabase_client
from app.services.pii import redact_pii

logger = get_logger(__name__)

CHUNK_SIZE = 512
CHUNK_OVERLAP = 50
BATCH_SIZE = 100

splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    separators=["\n\n", "\n", ". ", " ", ""],
    length_function=len,
)

def compute_file_hash(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
    if not text.strip():
        text = _ocr_fallback(file_bytes)
    return text


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = DocxDocument(io.BytesIO(file_bytes))
    return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())


def _ocr_fallback(file_bytes: bytes) -> str:
    try:
        import pytesseract
        from pdf2image import convert_from_bytes

        images = convert_from_bytes(file_bytes)
        ocr_text = "\n\n".join(pytesseract.image_to_string(img) for img in images)
        if ocr_text.strip():
            logger.warning(
                "OCR fallback used for scanned PDF — admin should verify quality",
                extra={"extra_data": {"chars": len(ocr_text)}},
            )
        return ocr_text
    except Exception as exc:
        logger.warning("OCR fallback unavailable", extra={"extra_data": {"error": str(exc)}})
        return ""


def extract_text(filename: str, file_bytes: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    if lower.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    raise ValueError("Unsupported file type")


async def embed_batch(texts: list[str]) -> list[list[float]]:
    settings = get_settings()
    if not is_embedding_available():
        raise RuntimeError("No embedding provider configured — set feature-flags.json and .env")

    async def _call() -> list[list[float]]:
        return await embed_texts(texts)

    return await asyncio.wait_for(_call(), timeout=settings.embed_timeout_seconds)


async def ingest_document(
    tenant_id: str,
    category: str,
    filename: str,
    file_bytes: bytes,
    ingested_by: str,
    job_id: str | None = None,
) -> dict[str, Any]:
    file_hash = compute_file_hash(file_bytes)

    existing = await supabase_client.find_document_by_hash(tenant_id, file_hash)
    if existing:
        raise DuplicateDocumentError(existing["id"], existing["source_filename"])

    raw_text = extract_text(filename, file_bytes)
    if not raw_text.strip():
        raise ValueError("Document contains no extractable text")

    redacted_text = redact_pii(raw_text)
    chunks = splitter.split_text(redacted_text)

    if job_id:
        await supabase_client.update_ingestion_job(
            job_id,
            {"chunks_total": len(chunks), "status": "processing", "progress_pct": 5},
        )

    all_embeddings: list[list[float]] = []
    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i : i + BATCH_SIZE]
        try:
            embeddings = await embed_batch(batch)
        except asyncio.TimeoutError as exc:
            if job_id:
                await supabase_client.update_ingestion_job(
                    job_id,
                    {
                        "status": "partial",
                        "chunks_done": len(all_embeddings),
                        "error_message": "Embedding API timeout — partial ingestion saved",
                    },
                )
            raise EmbeddingTimeoutError(len(all_embeddings), len(chunks)) from exc
        all_embeddings.extend(embeddings)

        if job_id:
            done = len(all_embeddings)
            pct = int(10 + (done / len(chunks)) * 85)
            await supabase_client.update_ingestion_job(
                job_id,
                {"chunks_done": done, "progress_pct": min(pct, 95)},
            )

    document = await supabase_client.create_clinic_document(
        tenant_id=tenant_id,
        source_filename=filename,
        category=category,
        file_hash=file_hash,
        chunk_count=len(chunks),
        ingested_by=ingested_by,
    )

    records = [
        {
            "document_id": document["id"],
            "tenant_id": tenant_id,
            "source_filename": filename,
            "category": category,
            "content_payload": chunk,
            "embedding": embedding,
            "chunk_index": idx,
            "token_count": len(chunk.split()),
            "ingested_by": ingested_by,
            "file_hash": file_hash,
        }
        for idx, (chunk, embedding) in enumerate(zip(chunks, all_embeddings))
    ]
    await supabase_client.bulk_insert_protocols(records)

    if job_id:
        await supabase_client.update_ingestion_job(
            job_id,
            {
                "document_id": document["id"],
                "status": "completed",
                "chunks_done": len(chunks),
                "progress_pct": 100,
            },
        )

    return {
        "document_id": document["id"],
        "chunks_ingested": len(records),
        "filename": filename,
        "file_hash": file_hash,
    }


class DuplicateDocumentError(Exception):
    def __init__(self, document_id: str, filename: str):
        self.document_id = document_id
        self.filename = filename
        super().__init__(f"Document already ingested: {filename}")


class EmbeddingTimeoutError(Exception):
    def __init__(self, chunks_done: int, chunks_total: int):
        self.chunks_done = chunks_done
        self.chunks_total = chunks_total
        super().__init__(f"Embedding timeout at {chunks_done}/{chunks_total}")
