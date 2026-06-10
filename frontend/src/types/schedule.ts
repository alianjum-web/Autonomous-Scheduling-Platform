/** Schedule / booking API contracts (FastAPI /v1/schedule/*). */

import type { Appointment } from "@/types/appointments";
import type { AppointmentStatus } from "@/types/database.types";

export interface SlotsResponse {
  slots: string[];
}

export interface BookAppointmentRequest {
  slot_start: string;
  selected_slot?: string;
  patient_name: string;
  patient_phone?: string;
  session_id?: string;
  provider_name?: string;
  treatment_type?: string;
}

export interface BookAppointmentResponse {
  appointment: Appointment;
  confirmation_code: string;
  slot_start: string;
  slot_end: string;
  status: AppointmentStatus | string;
}

export interface CancelAppointmentResponse {
  appointment_id: string;
  status: string;
}

export interface AppointmentsListResponse {
  appointments: Appointment[];
}

export interface UpdateAppointmentStatusRequest {
  id: string;
  status: AppointmentStatus;
}

export interface UpdateAppointmentResponse {
  appointment: Appointment;
}

export interface CalendarConfigResponse {
  timezone: string;
  calendar_provider: "none" | "google" | "mock";
  google_calendar_id: string | null;
  business_hours_start: number;
  business_hours_end: number;
  slot_duration_minutes: number;
  google_connected: boolean;
  uses_mock_slots: boolean;
}

export interface CalendarConfigUpdateRequest {
  timezone: string;
  calendar_provider: "none" | "google" | "mock";
  google_calendar_id?: string | null;
  business_hours_start: number;
  business_hours_end: number;
  slot_duration_minutes: number;
}
