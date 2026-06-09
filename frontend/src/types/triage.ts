/** UI triage chat state types + FastAPI /v1/triage/* contracts. */

import type { ChatMessage as DbChatMessage } from "@/types/database.types";

export type TriageStatus =
  | "idle"
  | "connecting"
  | "streaming"
  | "completed"
  | "error"
  | "reconnecting";

/** LangGraph intent labels emitted in SSE meta. */
export type AgentIntent =
  | "faq"
  | "booking_request"
  | "slot_confirmation"
  | "cancellation"
  | "escalation"
  | "emergency"
  | "unknown";

/** Payload after `data: [META]` in the triage SSE stream. */
export interface TriageStreamMeta {
  available_slots: string[];
  should_escalate: boolean;
  is_emergency: boolean;
  intent: AgentIntent;
  booking_confirmed: boolean;
  confirmation_code: string | null;
  booked_slot: string | null;
}

export interface ChatMessage {
  id: string;
  role: DbChatMessage["role"];
  content: string;
  streaming?: boolean;
}

export interface CreateTriageSessionRequest {
  metadata?: Record<string, string | number | boolean | null>;
}

export interface CreateTriageSessionResponse {
  session_id: string;
  status: string;
}

export interface TriageMessageRequest {
  message: string;
  history?: DbChatMessage[];
}

export interface EscalateSessionRequest {
  sessionId: string;
  patient_name?: string;
  ai_summary?: string;
}

export interface EscalateSessionResponse {
  session_id: string;
  status: string;
}

/** WebSocket frame from `/v1/triage/ws/{session_id}`. */
export interface TriageWebSocketFrame {
  token?: string;
  meta?: TriageStreamMeta;
  done?: boolean;
  error?: string;
}

export interface TriageWebSocketOutbound {
  message: string;
  history: DbChatMessage[];
  authorization: string;
}

const AGENT_INTENTS: readonly AgentIntent[] = [
  "faq",
  "booking_request",
  "slot_confirmation",
  "cancellation",
  "escalation",
  "emergency",
  "unknown",
];
// if return true, then the value is a valid AgentIntent
export function isAgentIntent(value: unknown): value is AgentIntent {
  return typeof value === "string" && (AGENT_INTENTS as readonly string[]).includes(value);
}
// if return true, then the value is a valid TriageStreamMeta object
export function isTriageStreamMeta(value: unknown): value is Partial<TriageStreamMeta> {
  return typeof value === "object" && value !== null;
}
