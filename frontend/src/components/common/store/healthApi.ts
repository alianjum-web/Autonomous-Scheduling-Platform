import { baseApi } from "./baseApi";
import type { AIStatusResponse, HealthResponse } from "@/types/health";

export type {
  AIProviderStatus,
  AIStatusResponse,
  HealthChecks,
  HealthResponse,
  PlatformHealthStatus,
} from "@/types/health";

export const healthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query<HealthResponse, void>({
      query: () => "/health",
    }),
    getAIStatus: builder.query<AIStatusResponse, void>({
      query: () => "/v1/ai/status",
    }),
  }),
});

export const { useGetHealthQuery, useGetAIStatusQuery } = healthApi;
