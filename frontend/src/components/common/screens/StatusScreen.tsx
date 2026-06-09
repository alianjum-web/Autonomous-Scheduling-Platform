"use client";

import { Activity, CheckCircle2, Database, RefreshCw, Server, XCircle } from "lucide-react";

import { PageShell } from "@/components/common/layout/PageShell";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { SectionHeading } from "@/components/common/molecules/SectionHeading";
import { useGetAIStatusQuery, useGetHealthQuery } from "@/components/common/store/healthApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-3.5 last:border-0">
      <div className="flex items-center gap-2.5">
        {ok ? (
          <CheckCircle2 className="size-4 text-success" aria-hidden />
        ) : (
          <XCircle className="size-4 text-destructive" aria-hidden />
        )}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className={cn("text-sm", ok ? "text-muted-foreground" : "text-destructive")}>
        {detail ?? (ok ? "Operational" : "Unavailable")}
      </span>
    </div>
  );
}

export function StatusScreen() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const { data: health, isLoading, isFetching, error, refetch } = useGetHealthQuery();
  const {
    data: aiStatus,
    isLoading: aiLoading,
    refetch: refetchAI,
  } = useGetAIStatusQuery();

  const loading = isLoading || isFetching;
  const allHealthy = health?.status === "healthy";
  const errorMessage = error ? "Unable to reach the API health endpoint." : null;

  return (
    <PageShell maxWidth="6xl" className="gap-10 pb-20">
      <PageHeader
        eyebrow="Operations"
        title="System Status"
        description="Live health checks for the FastAPI gateway, database, Redis, and AI providers (Ollama, OpenAI, Gemini, Grok)."
        imageKey="hero"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch();
              void refetchAI();
            }}
            disabled={loading}
            className="gap-1.5 rounded-full"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
            Refresh
          </Button>
        }
      />

      <Card className={cn("hero-glow", allHealthy ? "border-success/30" : "border-warning/40")}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2.5">
            <Activity className="size-5 text-primary" aria-hidden />
            Platform health
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !health ? (
            <p className="text-sm text-muted-foreground">Checking services…</p>
          ) : errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : health ? (
            <>
              <p className="mb-5 text-sm capitalize text-muted-foreground">
                Overall:{" "}
                <span className={cn("font-semibold", allHealthy ? "text-success" : "text-warning")}>
                  {health.status}
                </span>
              </p>
              <StatusRow label="PostgreSQL (Supabase)" ok={health.checks.database} />
              <StatusRow label="Redis (slot locks)" ok={health.checks.redis} />
              <StatusRow
                label={`AI chat (${health.checks.ai_provider ?? "none"})`}
                ok={health.checks.ai}
                detail={
                  health.checks.ai_latency_ms != null
                    ? `${health.checks.ai_latency_ms} ms`
                    : health.checks.ai
                      ? "Configured"
                      : "Not configured"
                }
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      {aiStatus ? (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">AI provider probes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Active chat:{" "}
              <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">
                {aiStatus.chat_provider}
              </code>
              {" · "}
              Active embeddings:{" "}
              <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">
                {aiStatus.embedding_provider}
              </code>
              {aiStatus.hot_reload ? " · hot reload on" : ""}
            </p>
            {aiStatus.providers.map((provider) => (
              <StatusRow
                key={provider.provider}
                label={provider.provider}
                ok={provider.ok}
                detail={
                  provider.error ??
                  (provider.active_for_chat || provider.active_for_embedding
                    ? `${provider.model ?? "—"}${provider.latency_ms != null ? ` · ${provider.latency_ms} ms` : ""}`
                    : provider.configured
                      ? "Standby"
                      : "No API key / Ollama offline")
                }
              />
            ))}
          </CardContent>
        </Card>
      ) : aiLoading ? (
        <p className="text-sm text-muted-foreground">Probing AI providers…</p>
      ) : null}

      <section className="space-y-5">
        <SectionHeading>Infrastructure</SectionHeading>
        <div className="grid gap-5 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2.5 text-base">
                <Server className="size-4 text-primary" aria-hidden />
                API gateway
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              FastAPI microservice at{" "}
              <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">{apiBase}</code>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2.5 text-base">
                <Database className="size-4 text-primary" aria-hidden />
                Data plane
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              Supabase PostgreSQL with RLS, Realtime, and pgvector for clinic document RAG.
            </CardContent>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
