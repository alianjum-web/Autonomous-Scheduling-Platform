import { baseApi } from "@/components/common/store/baseApi";
import type {
  CreateTriageSessionRequest,
  CreateTriageSessionResponse,
  EscalateSessionRequest,
  EscalateSessionResponse,
} from "@/types/triage";

export const triageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createTriageSession: builder.mutation<CreateTriageSessionResponse, CreateTriageSessionRequest>({
      query: (body) => ({
        url: "/v1/triage/session",
        method: "POST",
        body,
      }),
    }),
    escalateSession: builder.mutation<EscalateSessionResponse, EscalateSessionRequest>({
      query: ({ sessionId, ...body }) => ({
        url: `/v1/triage/escalate/${sessionId}`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useCreateTriageSessionMutation, useEscalateSessionMutation } = triageApi;
