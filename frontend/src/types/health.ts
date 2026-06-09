/** Health & AI provider probe API contracts. */

export type PlatformHealthStatus = "healthy" | "degraded";

export interface HealthChecks {
  database: boolean;
  redis: boolean;
  ai: boolean;
  ai_provider: string | null;
  ai_latency_ms: number | null;
  /** @deprecated use `ai` — kept for backward compatibility with older backends */
  openai: boolean;
  openai_latency_ms: number | null;
}

export interface HealthResponse {
  status: PlatformHealthStatus | string;
  checks: HealthChecks;
}

export interface AIProviderStatus {
  provider: string;
  configured: boolean;
  enabled: boolean;
  active_for_chat: boolean;
  active_for_embedding: boolean;
  ok: boolean;
  latency_ms: number | null;
  model: string | null;
  error: string | null;
}

export interface AIStatusResponse {
  chat_provider: string;
  embedding_provider: string;
  hot_reload: boolean;
  providers: AIProviderStatus[];
}
