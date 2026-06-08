export type TriageStatus =
  | "idle"
  | "connecting"
  | "streaming"
  | "completed"
  | "error"
  | "reconnecting";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  streaming?: boolean;
}
