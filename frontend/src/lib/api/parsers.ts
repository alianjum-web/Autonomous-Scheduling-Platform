/** Runtime parsers for streaming API payloads — use at network boundaries. */

import {
  getApiErrorCode,
  getApiErrorMessage,
  isFastApiErrorResponse,
  type ApiErrorDetail,
  type FastApiErrorResponse,
} from "@/types/api";
import {
  isAgentIntent,
  isTriageStreamMeta,
  type TriageStreamMeta,
  type TriageWebSocketFrame,
} from "@/types/triage";

export function parseTriageStreamMeta(json: string): TriageStreamMeta | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isTriageStreamMeta(parsed)) return null;
    const record = parsed as Partial<TriageStreamMeta>;
    return {
      available_slots: record.available_slots ?? [],
      should_escalate: record.should_escalate ?? false,
      is_emergency: record.is_emergency ?? false,
      intent: record.intent && isAgentIntent(record.intent) ? record.intent : "unknown",
      booking_confirmed: record.booking_confirmed ?? false,
      confirmation_code: record.confirmation_code ?? null,
      booked_slot: record.booked_slot ?? null,
    };
  } catch {
    return null;
  }
}

export function parseTriageWebSocketFrame(raw: string): TriageWebSocketFrame | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as TriageWebSocketFrame;
  } catch {
    return null;
  }
}

export function parseFastApiErrorFromResponse(body: unknown): FastApiErrorResponse | null {
  return isFastApiErrorResponse(body) ? body : null;
}

export function extractBaaRequiredMessage(body: unknown): string | null {
  const err = parseFastApiErrorFromResponse(body);
  if (!err) return null;
  const detail: ApiErrorDetail = err.detail;
  if (getApiErrorCode(detail) !== "baa_required") return null;
  return getApiErrorMessage(detail, "HIPAA BAA required before using AI chat.");
}

export type SseStreamEventKind = "done" | "meta" | "token";

export function classifySseDataLine(data: string): SseStreamEventKind {
  if (data === "[DONE]") return "done";
  if (data.startsWith("[META]")) return "meta";
  return "token";
}
