"use client";

import Link from "next/link";
import { Building2, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clinicBookingUrl } from "@/lib/nav/roleNav";

interface SettingsWorkspaceCardProps {
  clinicName: string;
  workspaceSlug: string | null;
  configured: boolean;
  /** Profile linked to a tenant but name/slug still loading from the API. */
  syncing?: boolean;
}

export function SettingsWorkspaceCard({
  clinicName,
  workspaceSlug,
  configured,
  syncing = false,
}: SettingsWorkspaceCardProps) {
  const patientUrl = workspaceSlug ? clinicBookingUrl(workspaceSlug) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-5 text-primary" aria-hidden />
          Workspace
        </CardTitle>
        <CardDescription>Your clinic tenant on this platform</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-border/60 pb-3">
          <span className="text-muted-foreground">Clinic</span>
          <span className="font-medium">
            {syncing ? "Loading workspace…" : clinicName}
          </span>
        </div>
        <div className="flex justify-between gap-4 border-b border-border/60 pb-3">
          <span className="text-muted-foreground">Slug</span>
          <span className="font-mono text-xs">
            {syncing ? "…" : (workspaceSlug ?? "—")}
          </span>
        </div>
        {syncing ? (
          <p className="text-xs text-muted-foreground">
            Your account is linked to a clinic — refreshing session to load details. If this
            persists, sign out and sign back in.
          </p>
        ) : null}
        {configured && patientUrl ? (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-muted-foreground">Patient booking URL</span>
            <Button asChild variant="outline" size="sm">
              <Link href={patientUrl} target="_blank" rel="noopener noreferrer">
                Preview page
                <ExternalLink className="ml-2 size-3.5" aria-hidden />
              </Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
