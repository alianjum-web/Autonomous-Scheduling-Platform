/** Schedule / booking API contracts (FastAPI /v1/schedule/*). */

import type { Appointment } from "@/types/appointments";
import type { AppointmentStatus } from "@/types/database";

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
