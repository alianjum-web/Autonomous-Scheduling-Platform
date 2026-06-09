"use client";

import Link from "next/link";
import { ShieldAlert, ShieldCheck } from "lucide-react";

import { useAdminGuard } from "@/components/common/hooks/useAdminGuard";
import { useGetBAAStatusQuery } from "@/components/common/store/settingsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BAAComplianceBannerProps {
  context?: "chat" | "docs" | "status";
  className?: string;
}

export function BAAComplianceBanner({ context = "chat", className }: BAAComplianceBannerProps) {
  const { isAdmin } = useAdminGuard();
  const { data: baa, isLoading } = useGetBAAStatusQuery();

  if (isLoading || !baa) return null;

  if (baa.ai_features_available) {
    if (context !== "status" || !baa.baa_signed) return null;
    return (
      <Card className={cn("border-success/30 bg-success/5", className)}>
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
          <div>
            <p className="font-medium">HIPAA BAA active</p>
            <p className="text-muted-foreground">
              AI triage and document embedding are enabled
              {baa.signed_at ? ` (signed ${new Date(baa.signed_at).toLocaleString()})` : ""}.
              {baa.enforcement_enabled ? " Enforcement is on for this environment." : ""}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const contextCopy =
    context === "docs"
      ? "Document upload and embedding are disabled until your clinic completes the HIPAA BAA."
      : context === "status"
        ? "AI features are blocked for this clinic until a BAA is acknowledged."
        : "AI patient chat is disabled until your clinic completes the HIPAA Business Associate Agreement.";

  return (
    <Card className={cn("border-warning/50 bg-warning/10", className)}>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 text-sm">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="font-medium text-warning-foreground">HIPAA BAA required</p>
            <p className="text-muted-foreground">{contextCopy}</p>
            {baa.enforcement_enabled ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Environment: <span className="font-mono">{baa.environment}</span> · enforcement on
              </p>
            ) : null}
          </div>
        </div>
        {isAdmin ? (
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href="/settings">Acknowledge BAA in Settings</Link>
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground sm:max-w-[200px] sm:text-right">
            Ask a clinic admin to sign in and acknowledge the BAA under Settings.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
