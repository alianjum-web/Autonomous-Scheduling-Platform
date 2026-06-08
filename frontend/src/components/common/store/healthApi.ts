import { baseApi } from "./baseApi";

export interface HealthChecks {
  database: boolean;
  redis: boolean;
  openai: boolean;
  openai_latency_ms: number | null;
}

export interface HealthResponse {
  status: string;
  checks: HealthChecks;
}

export const healthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query<HealthResponse, void>({
      query: () => "/health",
    }),
  }),
});

export const { useGetHealthQuery } = healthApi;
