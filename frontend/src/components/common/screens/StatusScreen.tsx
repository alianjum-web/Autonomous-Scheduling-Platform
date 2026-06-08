"use client";

import { Activity, CheckCircle2, Database, RefreshCw, Server, XCircle } from "lucide-react";

import { PageShell } from "@/components/common/layout/PageShell";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { useGetHealthQuery } from "@/components/common/store/healthApi";
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
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 last:border-0">
      <div className="flex items-center gap-2">
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

  const loading = isLoading || isFetching;
  const allHealthy = health?.status === "healthy";
  const errorMessage = error ? "Unable to reach the API health endpoint." : null;

  return (
    <PageShell maxWidth="2xl" className="gap-8 pb-16">
      <PageHeader
        eyebrow="Operations"
        title="System Status"
        description="Live health checks for the FastAPI gateway, database, Redis, and OpenAI connectivity."
        imageKey="hero"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading} className="gap-1.5">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
            Refresh
          </Button>
        }
      />

      <Card className={cn("hero-glow", allHealthy ? "border-success/30" : "border-warning/40")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
              <p className="mb-4 text-sm capitalize text-muted-foreground">
                Overall:{" "}
                <span className={cn("font-semibold", allHealthy ? "text-success" : "text-warning")}>
                  {health.status}
                </span>
              </p>
              <StatusRow label="PostgreSQL (Supabase)" ok={health.checks.database} />
              <StatusRow label="Redis (slot locks)" ok={health.checks.redis} />
              <StatusRow
                label="OpenAI API"
                ok={health.checks.openai}
                detail={
                  health.checks.openai_latency_ms != null
                    ? `${health.checks.openai_latency_ms} ms`
                    : health.checks.openai
                      ? "Configured"
                      : "Not configured"
                }
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="size-4 text-primary" aria-hidden />
              API gateway
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            FastAPI microservice at{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{apiBase}</code>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="size-4 text-primary" aria-hidden />
              Data plane
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Supabase PostgreSQL with RLS, Realtime, and pgvector for clinic document RAG.
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
