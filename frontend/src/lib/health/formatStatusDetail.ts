/** Short, human-readable labels for health / AI probe errors in the UI. */

export function formatStatusDetail(detail: string | undefined, ok: boolean): string | undefined {
  if (!detail) return detail;
  if (ok) return detail;

  const lower = detail.toLowerCase();
  if (lower.includes("incorrect api key") || lower.includes("invalid_api_key")) {
    return "Invalid API key — set OPENAI_API_KEY in backend env.";
  }
  if (lower.includes("connection error")) {
    return "Connection error — start Ollama or switch provider in feature flags.";
  }
  if (lower.includes("no api key") || lower.includes("ollama offline")) {
    return "Not configured";
  }
  if (detail.length > 56) {
    return `${detail.slice(0, 53)}…`;
  }
  return detail;
}

export function resolveOverallLabel(
  healthStatus: string | undefined,
  checks: { database: boolean; redis: boolean; ai: boolean } | undefined,
): { label: string; tone: "success" | "warning" | "destructive" } {
  if (!checks) {
    return { label: healthStatus ?? "unknown", tone: "warning" };
  }
  if (!checks.database || !checks.redis) {
    return { label: "unavailable", tone: "destructive" };
  }
  if (!checks.ai) {
    return { label: "degraded", tone: "warning" };
  }
  return { label: healthStatus === "healthy" ? "healthy" : "degraded", tone: "success" };
}
