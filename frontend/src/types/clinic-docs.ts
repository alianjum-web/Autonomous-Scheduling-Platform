import type {
  ClinicDocumentRow,
  DocumentCategory,
  IngestionJobRow,
  IngestionJobStatus,
} from "@/types/database.types";

export type { DocumentCategory, IngestionJobStatus };

export type ClinicDocument = Omit<ClinicDocumentRow, "tenant_id">;

export type IngestionJob = Pick<
  IngestionJobRow,
  "id" | "filename" | "category" | "status" | "progress_pct" | "chunks_total" | "chunks_done"
> & {
  error_message?: string | null;
  document_id?: string | null;
};

export interface UploadProgress {
  jobId: string;
  filename: string;
  progress: number;
  status: IngestionJobStatus;
}

export interface UploadFormState {
  category: DocumentCategory;
  pendingFileName: string | null;
  pendingFileSize: number | null;
  dragOver: boolean;
  error: string | null;
}

export interface DocumentChunk {
  id: string;
  chunk_index: number;
  content_payload: string;
  category: string;
  token_count: number;
  similarity?: number;
}
