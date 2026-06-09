/** Cross-module type barrel — domain types live here, not in store slices. */

export type { Database } from "@/types/database";
export type {
  AppointmentRow,
  AppointmentStatus,
  ChatMessage as DbChatMessage,
  ClinicDocumentRow,
  IngestionJobRow,
  IngestionJobStatus,
  PatientSessionRow,
  ProfileRow,
  SessionStatus,
} from "@/types/database.types";

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

export type {
  AgentIntent,
  ChatMessage,
  CreateTriageSessionRequest,
  CreateTriageSessionResponse,
  EscalateSessionRequest,
  EscalateSessionResponse,
  TriageMessageRequest,
  TriageStatus,
  TriageStreamMeta,
  TriageWebSocketFrame,
  TriageWebSocketOutbound,
} from "@/types/triage";

export type {
  ApiErrorBody,
  ApiErrorCode,
  ApiErrorDetail,
  FastApiErrorResponse,
  StructuredApiErrorDetail,
} from "@/types/api";

export type {
  BookAppointmentRequest,
  BookAppointmentResponse,
  AppointmentsListResponse,
  CancelAppointmentResponse,
  SlotsResponse,
  UpdateAppointmentResponse,
  UpdateAppointmentStatusRequest,
} from "@/types/schedule";

export type { BAAAcknowledgeResponse, BAAStatusResponse } from "@/types/compliance";

export type {
  AIProviderStatus,
  AIStatusResponse,
  HealthChecks,
  HealthResponse,
  PlatformHealthStatus,
} from "@/types/health";

export type { UserProfileSummary } from "@/types/settings";

export type {
  AppJwtPayload,
  AppMetadataClaims,
  ClinicRole,
} from "@/types/auth";

export type {
  ProfileTenantEmbed,
  ProfileWithTenant,
  UserProfileFetchResult,
} from "@/types/supabase-profile";

export type {
  DeleteDocumentResponse,
  DocumentChunksResponse,
  DocumentListResponse,
  IngestUploadResponse,
} from "@/types/ingest";

export type {
  UseAdminGuardReturn,
  UseAuthSessionReturn,
  UseBookingFlowReturn,
  UseStreamingChatReturn,
  StreamEventKind,
} from "@/types/hooks";

export {
  isAgentIntent,
  isTriageStreamMeta,
} from "@/types/triage";

export {
  getApiErrorCode,
  getApiErrorMessage,
  isApiErrorBody,
  isFastApiErrorResponse,
  isIngestUploadResponse,
  isStructuredApiErrorDetail,
  parseFastApiErrorResponse,
} from "@/types/api";

export { isClinicRole, parseJwtPayload } from "@/types/auth";
