"use client";

import { Activity, CheckCircle2, Database, RefreshCw, Server, XCircle } from "lucide-react";

import { PageShell } from "@/components/common/layout/PageShell";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { SectionHeading } from "@/components/common/molecules/SectionHeading";
import { BAAComplianceBanner } from "@/components/common/molecules/BAAComplianceBanner";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { useGetAIStatusQuery, useGetHealthQuery } from "@/components/common/store/healthApi";
import { useGetBAAStatusQuery } from "@/components/common/store/settingsApi";
import { formatStatusDetail, resolveOverallLabel } from "@/lib/health/formatStatusDetail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatusTone = "ok" | "warn" | "error";

function StatusRow({
  label,
  tone,
  detail,
  detailTitle,
}: {
  label: string;
  tone: StatusTone;
  detail?: string;
  detailTitle?: string;
}) {
  const ok = tone === "ok";
  const displayDetail = formatStatusDetail(detail, ok) ?? (ok ? "Operational" : "Unavailable");

  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-3.5 last:border-0">
      <div className="flex min-w-0 items-center gap-2.5">
        {ok ? (
          <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
        ) : (
          <XCircle
            className={cn(
              "size-4 shrink-0",
              tone === "warn" ? "text-warning" : "text-destructive",
            )}
            aria-hidden
          />
        )}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span
        className={cn(
          "max-w-[min(100%,14rem)] shrink-0 text-right text-sm sm:max-w-xs",
          ok && "text-muted-foreground",
          tone === "warn" && "text-warning",
          tone === "error" && "text-destructive",
        )}
        title={detailTitle ?? (detail !== displayDetail ? detail : undefined)}
      >
        {displayDetail}
      </span>
    </div>
  );
}

function aiRowTone(ok: boolean, configured: boolean, active: boolean): StatusTone {
  if (ok) return "ok";
  if (!configured && !active) return "warn";
  return "error";
}

export function StatusScreen() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const { session } = useAuthSession();
  const { data: baa } = useGetBAAStatusQuery(undefined, { skip: !session });
  const { data: health, isLoading, isFetching, error, refetch } = useGetHealthQuery();
  const {
    data: aiStatus,
    isLoading: aiLoading,
    refetch: refetchAI,
  } = useGetAIStatusQuery();

  const loading = isLoading || isFetching;
  const errorMessage = error ? "Unable to reach the API health endpoint." : null;
  const overall = resolveOverallLabel(health?.status, health?.checks);
  const cardBorder =
    overall.tone === "success"
      ? "border-success/30"
      : overall.tone === "warning"
        ? "border-warning/40"
        : "border-destructive/40";

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

      <Card className={cn("hero-glow", cardBorder)}>
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
              <p className="mb-5 text-sm text-muted-foreground">
                Overall:{" "}
                <span
                  className={cn(
                    "font-semibold capitalize",
                    overall.tone === "success" && "text-success",
                    overall.tone === "warning" && "text-warning",
                    overall.tone === "destructive" && "text-destructive",
                  )}
                >
                  {overall.label}
                </span>
              </p>
              <StatusRow
                label="PostgreSQL (Supabase)"
                tone={health.checks.database ? "ok" : "error"}
              />
              <StatusRow label="Redis (slot locks)" tone={health.checks.redis ? "ok" : "error"} />
              <StatusRow
                label={`AI chat (${health.checks.ai_provider ?? "none"})`}
                tone={health.checks.ai ? "ok" : "warn"}
                detail={
                  health.checks.ai_latency_ms != null
                    ? `${health.checks.ai_latency_ms} ms`
                    : health.checks.ai
                      ? "Configured"
                      : "Not configured"
                }
              />
              {baa ? (
                <StatusRow
                  label="HIPAA BAA (tenant)"
                  tone={baa.ai_features_available ? "ok" : "warn"}
                  detail={
                    baa.baa_signed
                      ? `Signed · ${baa.enforcement_enabled ? "enforced" : "dev mode"}`
                      : baa.enforcement_enabled
                        ? "Unsigned — AI blocked"
                        : "Unsigned — enforcement off"
                  }
                />
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>

      {session ? <BAAComplianceBanner context="status" /> : null}

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
            {aiStatus.providers.map((provider) => {
              const active = provider.active_for_chat || provider.active_for_embedding;
              const tone = aiRowTone(provider.ok, provider.configured, active);
              const detail =
                provider.error ??
                (active
                  ? `${provider.model ?? "—"}${provider.latency_ms != null ? ` · ${provider.latency_ms} ms` : ""}`
                  : provider.configured
                    ? "Standby"
                    : "Not configured");

              return (
                <StatusRow
                  key={provider.provider}
                  label={provider.provider}
                  tone={tone}
                  detail={detail}
                  detailTitle={provider.error ?? undefined}
                />
              );
            })}
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
              <code className="break-all rounded-md bg-muted px-1.5 py-0.5 text-xs">{apiBase}</code>
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
