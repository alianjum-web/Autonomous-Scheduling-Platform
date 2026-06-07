"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, CheckCircle2, Database, RefreshCw, Server, XCircle } from "lucide-react";

import { PageHeader, PageShell } from "@/components/common/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HealthChecks {
  database: boolean;
  redis: boolean;
  openai: boolean;
  openai_latency_ms: number | null;
}

interface HealthResponse {
  status: string;
  checks: HealthChecks;
}

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
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/health`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as HealthResponse;
      setHealth(data);
    } catch {
      setError("Unable to reach the API health endpoint.");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBase}/health`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as HealthResponse;
        if (active) setHealth(data);
      } catch {
        if (active) {
          setError("Unable to reach the API health endpoint.");
          setHealth(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [apiBase]);

  const allHealthy = health?.status === "healthy";

  return (
    <PageShell maxWidth="2xl" className="gap-8 pb-16">
      <PageHeader
        eyebrow="Operations"
        title="System Status"
        description="Live health checks for the FastAPI gateway, database, Redis, and OpenAI connectivity."
        actions={
          <Button variant="outline" size="sm" onClick={fetchHealth} disabled={loading} className="gap-1.5">
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
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
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
