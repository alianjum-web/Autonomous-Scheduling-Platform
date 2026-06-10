/** Explicit return types for shared React hooks. */

import type { Session } from "@supabase/supabase-js";

import type { ClinicRole } from "@/types/auth";
import type { AvailableSlot, BookingStep } from "@/types/booking";
import type { SendChatMessageOptions } from "@/types/triage";

export interface UseAuthSessionReturn {
  session: Session | null;
  loading: boolean;
  tenantId: string | null;
  accessToken: string | null;
  refreshSession: () => Promise<Session | null>;
}

export interface UseAdminGuardReturn {
  loading: boolean;
  isAdmin: boolean;
  clinicRole: ClinicRole | string | null;
}

export interface UseBookingFlowReturn {
  availableSlots: AvailableSlot[];
  slotsLoading: boolean;
  selectedSlot: string | null;
  bookingStep: BookingStep;
  confirmationCode: string | null;
  patientName: string;
  patientPhone: string;
  reserving: boolean;
  chooseSlot: (iso: string) => void;
  confirmBooking: () => Promise<void>;
}

export type StreamEventKind = "done" | "meta" | "token";

export interface UseStreamingChatReturn {
  startChat: () => Promise<void>;
  sendMessage: (message: string, options?: SendChatMessageOptions) => Promise<void>;
  resumeStream: () => Promise<void>;
  closeStream: () => void;
}
