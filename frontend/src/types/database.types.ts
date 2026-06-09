/**
 * Convenience aliases over generated Database types.
 * Kept separate from database.ts so `npm run gen:types` can regenerate safely.
 */

import type { Database } from "@/types/database";

type PublicTables = Database["public"]["Tables"];

export type AppointmentRow = PublicTables["appointments"]["Row"];
export type AppointmentStatus = AppointmentRow["status"];

export type PatientSessionRow = PublicTables["patient_sessions"]["Row"];
export type SessionStatus = PatientSessionRow["status"];

export type ProfileRow = PublicTables["profiles"]["Row"];

export type ClinicDocumentRow = PublicTables["clinic_documents"]["Row"];
export type DocumentCategory = ClinicDocumentRow["category"];

export type IngestionJobRow = PublicTables["ingestion_jobs"]["Row"];
export type IngestionJobStatus = IngestionJobRow["status"];

/** Message shape stored in patient_sessions.message_history and sent to triage API. */
export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};
