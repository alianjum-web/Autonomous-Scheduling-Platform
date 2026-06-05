import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";

import { createClient } from "@/lib/supabase/client";
import type { Appointment } from "./appointmentsSlice";
import type { ClinicDocument, DocumentCategory, IngestionJob } from "./clinicDocsSlice";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: async (headers) => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 403) {
    const supabase = createClient();
    const { data } = await supabase.auth.refreshSession();
    if (data.session) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export interface DocumentChunk {
  id: string;
  chunk_index: number;
  content_payload: string;
  category: string;
  token_count: number;
  similarity?: number;
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Documents", "IngestionJob", "Appointments"],
  endpoints: (builder) => ({
    createTriageSession: builder.mutation<
      { session_id: string; status: string },
      { metadata?: Record<string, unknown> }
    >({
      query: (body) => ({
        url: "/v1/triage/session",
        method: "POST",
        body,
      }),
    }),
    getDocuments: builder.query<{ documents: ClinicDocument[] }, void>({
      query: () => "/v1/ingest/documents",
      providesTags: ["Documents"],
    }),
    getDocumentChunks: builder.query<{ chunks: DocumentChunk[] }, string>({
      query: (documentId) => `/v1/ingest/documents/${documentId}/chunks`,
    }),
    deleteDocument: builder.mutation<{ deleted: string }, string>({
      query: (documentId) => ({
        url: `/v1/ingest/document/${documentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Documents"],
    }),
    getIngestionStatus: builder.query<IngestionJob, string>({
      query: (jobId) => `/v1/ingest/status/${jobId}`,
      providesTags: (_result, _err, jobId) => [{ type: "IngestionJob", id: jobId }],
    }),
    getAvailableSlots: builder.query<{ slots: string[] }, void>({
      query: () => "/v1/schedule/slots",
      keepUnusedDataFor: 30,
    }),
    getAppointments: builder.query<{ appointments: Appointment[] }, string | void>({
      query: (date) => ({
        url: "/v1/schedule/appointments",
        params: date ? { date } : undefined,
      }),
      providesTags: ["Appointments"],
    }),
    bookAppointment: builder.mutation<
      {
        appointment: Appointment;
        confirmation_code: string;
        slot_start: string;
        slot_end: string;
        status: string;
      },
      {
        slot_start: string;
        patient_name: string;
        patient_phone?: string;
        session_id?: string;
        provider_name?: string;
        treatment_type?: string;
      }
    >({
      query: (body) => ({
        url: "/v1/schedule/book",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Appointments"],
    }),
    cancelAppointment: builder.mutation<{ appointment_id: string; status: string }, string>({
      query: (id) => ({
        url: `/v1/schedule/cancel/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Appointments"],
    }),
    escalateSession: builder.mutation<
      { session_id: string; status: string },
      { sessionId: string; patient_name?: string; ai_summary?: string }
    >({
      query: ({ sessionId, ...body }) => ({
        url: `/v1/triage/escalate/${sessionId}`,
        method: "POST",
        body,
      }),
    }),
    uploadDocument: builder.mutation<
      { job_id: string; status: string; filename: string },
      { file: File; category: DocumentCategory }
    >({
      queryFn: async ({ file, category }) => {
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          return { error: { status: 401, data: { detail: "Not authenticated" } } as FetchBaseQueryError };
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);

        const res = await fetch("/api/ingest", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: res.statusText }));
          return { error: { status: res.status, data: err } as FetchBaseQueryError };
        }

        const result = (await res.json()) as { job_id: string; status: string; filename: string };
        return { data: result };
      },
      invalidatesTags: ["Documents"],
    }),
  }),
});

export const {
  useCreateTriageSessionMutation,
  useGetAvailableSlotsQuery,
  useGetAppointmentsQuery,
  useBookAppointmentMutation,
  useCancelAppointmentMutation,
  useEscalateSessionMutation,
  useGetDocumentsQuery,
  useGetDocumentChunksQuery,
  useDeleteDocumentMutation,
  useGetIngestionStatusQuery,
  useUploadDocumentMutation,
} = api;
