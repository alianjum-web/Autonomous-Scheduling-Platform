/** Cross-module type barrel — import domain types from their owning module. */

export type {
  AppointmentRow,
  AppointmentStatus,
  ChatMessage as DbChatMessage,
  ClinicDocumentRow,
  Database,
  IngestionJobRow,
  IngestionJobStatus,
  PatientSessionRow,
  ProfileRow,
  SessionStatus,
} from "@/types/database";

export type { Appointment, Escalation, ViewMode } from "@/components/appointments/store/appointmentsSlice";

export type {
  ClinicDocument,
  DocumentCategory,
  IngestionJob,
  UploadFormState,
  UploadProgress,
} from "@/components/clinic-docs/store/clinicDocsSlice";

export type { DocumentChunk } from "@/components/clinic-docs/store/clinicDocsApi";

export type {
  AvailableSlot,
  BookingStep,
  SlotStatus,
} from "@/components/patient-triage/store/bookingSlice";

export type {
  ChatMessage,
  TriageStatus,
} from "@/components/patient-triage/store/triageSlice";

export type { AppDispatch, AppStore, RootState } from "@/components/common/store";
