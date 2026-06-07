/** Shared API error + ingest response shapes (client route handlers + RTK Query). */

export interface ApiErrorBody {
  detail: string;
  max_bytes?: number;
  guidance?: string;
}

export interface IngestUploadResponse {
  job_id: string;
  status: string;
  filename: string;
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "detail" in value &&
    typeof (value as ApiErrorBody).detail === "string"
  );
}

export function isIngestUploadResponse(value: unknown): value is IngestUploadResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "job_id" in value &&
    typeof (value as IngestUploadResponse).job_id === "string"
  );
}
