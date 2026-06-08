/** Cross-module type barrel — domain types live here, not in store slices. */

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

export type { Appointment, Escalation, ViewMode } from "@/types/appointments";

export type {
  ClinicDocument,
  DocumentCategory,
  DocumentChunk,
  IngestionJob,
  UploadFormState,
  UploadProgress,
} from "@/types/clinic-docs";

export type { AvailableSlot, BookingStep, SlotStatus } from "@/types/booking";

export type { ChatMessage, TriageStatus } from "@/types/triage";

export type { AppDispatch, AppStore, RootState } from "@/components/common/store";
