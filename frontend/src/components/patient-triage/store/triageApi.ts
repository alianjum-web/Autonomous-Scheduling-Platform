import { baseApi } from "@/components/common/store/baseApi";

export const triageApi = baseApi.injectEndpoints({
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
  }),
});

export const { useCreateTriageSessionMutation, useEscalateSessionMutation } = triageApi;
