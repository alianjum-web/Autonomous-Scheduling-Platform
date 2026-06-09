import type { AppointmentRow, AppointmentStatus, PatientSessionRow } from "@/types/database.types";

export type { AppointmentStatus };

export type Appointment = AppointmentRow;

export type ViewMode = "day" | "week";

export type Escalation = Pick<
  PatientSessionRow,
  "id" | "tenant_id" | "current_triage_status" | "status"
> & {
  patient_name?: string | null;
  ai_summary?: string | null;
  escalated_at?: string | null;
};
