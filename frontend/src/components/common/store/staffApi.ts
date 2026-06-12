import { baseApi } from "@/components/common/store/baseApi";

export interface StaffInvite {
  id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  email_sent?: boolean;
}

export interface StaffInvitePreview {
  clinic_name: string;
  email: string;
  role: string;
  expired: boolean;
}

export interface DoctorProvider {
  id: string;
  profile_id: string;
  display_name: string;
  specialty: string;
  is_active: boolean;
  availability_start: string;
  availability_end: string;
  slot_duration_minutes: number;
  role?: string | null;
  email?: string | null;
}

export interface OwnerDashboardStats {
  todays_appointments: number;
  upcoming_appointments: number;
  pending_requests: number;
  active_doctors: number;
  triage_sessions_today: number;
  triage_sessions_total: number;
  recent_patients: {
    id: string;
    name: string;
    phone: string | null;
    slot_start: string | null;
    confirmation_code: string | null;
  }[];
}

export interface DoctorDashboardStats {
  appointments_today: number;
  pending_reviews: number;
  upcoming_patients: { name: string; phone: string | null; slot_start: string | null }[];
  recent_intake_forms: number;
}

export interface TriageSessionSummary {
  id: string;
  status: string;
  triage_status: string | null;
  patient_name: string | null;
  chief_complaint: string | null;
  ai_summary: string | null;
  source: string | null;
  created_at: string;
  intake_complete: boolean;
}

export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listStaffInvites: builder.query<{ invites: StaffInvite[] }, void>({
      query: () => "/v1/staff/invites",
      providesTags: ["StaffInvites"],
    }),
    createStaffInvite: builder.mutation<
      StaffInvite,
      { email: string; role?: "doctor" | "clinic_admin" | "admin" }
    >({
      query: (body) => ({
        url: "/v1/staff/invites",
        method: "POST",
        body: { role: "doctor", ...body },
      }),
      invalidatesTags: ["StaffInvites"],
    }),
    previewStaffInvite: builder.query<StaffInvitePreview, string>({
      query: (token) => `/v1/staff/invites/preview?token=${encodeURIComponent(token)}`,
    }),
    listDoctors: builder.query<{ providers: DoctorProvider[] }, void>({
      query: () => "/v1/staff/doctors",
      providesTags: ["Doctors"],
    }),
    removeDoctor: builder.mutation<void, string>({
      query: (profileId) => ({
        url: `/v1/staff/doctors/${profileId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Doctors", "StaffInvites"],
    }),
    getMyProvider: builder.query<DoctorProvider, void>({
      query: () => "/v1/staff/doctors/me",
      providesTags: ["Doctors"],
    }),
    updateMyAvailability: builder.mutation<
      DoctorProvider,
      {
        availability_start: string;
        availability_end: string;
        slot_duration_minutes: number;
        specialty?: string;
      }
    >({
      query: (body) => ({
        url: "/v1/staff/doctors/me/availability",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Doctors"],
    }),
    getOwnerDashboard: builder.query<OwnerDashboardStats, void>({
      query: () => "/v1/staff/dashboard/owner",
    }),
    getDoctorDashboard: builder.query<DoctorDashboardStats, void>({
      query: () => "/v1/staff/dashboard/doctor",
    }),
    listTriageSessions: builder.query<
      { sessions: TriageSessionSummary[] },
      { intakeOnly?: boolean } | void
    >({
      query: (args) => {
        const intakeOnly = args?.intakeOnly ?? false;
        return `/v1/staff/triage/sessions?intake_only=${intakeOnly ? "true" : "false"}`;
      },
    }),
  }),
});

export const {
  useListStaffInvitesQuery,
  useCreateStaffInviteMutation,
  usePreviewStaffInviteQuery,
  useListDoctorsQuery,
  useRemoveDoctorMutation,
  useGetMyProviderQuery,
  useUpdateMyAvailabilityMutation,
  useGetOwnerDashboardQuery,
  useGetDoctorDashboardQuery,
  useListTriageSessionsQuery,
} = staffApi;
