import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import { extractBaaRequiredMessage } from "@/lib/api/parsers";

export function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === "object" && error !== null && "status" in error;
}

/** Extract BAA block message from an RTK Query mutation/query error. */
export function getBaaMessageFromRtkError(error: unknown): string | null {
  if (!isFetchBaseQueryError(error)) return null;
  return extractBaaRequiredMessage(error.data);
}
