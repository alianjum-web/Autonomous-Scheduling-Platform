/** Shared API error shapes, ingest responses, and JSON parsers. */

import type { IngestUploadResponse } from "@/types/ingest";

export type ApiErrorCode = "baa_required" | (string & {});

/** FastAPI validation / simple string errors. */
export interface ApiErrorBody {
  detail: string;
  max_bytes?: number;
  guidance?: string;
}

/** Structured FastAPI error detail (e.g. BAA gate). */
export interface StructuredApiErrorDetail {
  message: string;
  code: ApiErrorCode;
}

export type ApiErrorDetail = string | StructuredApiErrorDetail | ApiErrorBody;

export interface FastApiErrorResponse {
  detail: ApiErrorDetail;
}

export function isStructuredApiErrorDetail(value: unknown): value is StructuredApiErrorDetail {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as StructuredApiErrorDetail).message === "string" &&
    "code" in value &&
    typeof (value as StructuredApiErrorDetail).code === "string"
  );
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "detail" in value &&
    typeof (value as ApiErrorBody).detail === "string"
  );
}

export function isFastApiErrorResponse(value: unknown): value is FastApiErrorResponse {
  return typeof value === "object" && value !== null && "detail" in value;
}

export function parseFastApiErrorResponse(value: unknown): FastApiErrorResponse | null {
  return isFastApiErrorResponse(value) ? value : null;
}

export function getApiErrorCode(detail: ApiErrorDetail | undefined): ApiErrorCode | null {
  if (detail && typeof detail === "object" && "code" in detail) {
    return detail.code;
  }
  return null;
}

export function getApiErrorMessage(detail: ApiErrorDetail | undefined, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (isStructuredApiErrorDetail(detail)) return detail.message;
  if (detail && typeof detail === "object" && "detail" in detail && typeof detail.detail === "string") {
    return detail.detail;
  }
  return fallback;
}

export function isIngestUploadResponse(value: unknown): value is IngestUploadResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "job_id" in value &&
    typeof (value as IngestUploadResponse).job_id === "string"
  );
}

export type { IngestUploadResponse };
