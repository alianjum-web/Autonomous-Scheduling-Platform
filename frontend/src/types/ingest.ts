/** Ingest API response types (FastAPI /v1/ingest/* + Next.js proxy). */

import type { IngestionJobStatus } from "@/types/database";

export interface IngestUploadResponse {
  job_id: string;
  status: IngestionJobStatus | string;
  filename: string;
}

export interface DeleteDocumentResponse {
  deleted: string;
}

export interface DocumentListResponse {
  documents: import("@/types/clinic-docs").ClinicDocument[];
}

export interface DocumentChunksResponse {
  chunks: import("@/types/clinic-docs").DocumentChunk[];
}
