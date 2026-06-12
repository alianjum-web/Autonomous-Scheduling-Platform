"use client";

import Link from "next/link";
import { Bot } from "lucide-react";

import { useListTriageSessionsQuery } from "@/components/common/store/staffApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ACTIVE_STATUSES = new Set(["active", "escalated_to_human", "emergency"]);

function triagePatientLabel(session: {
  patient_name?: string | null;
  chief_complaint?: string | null;
  ai_summary?: string | null;
}): string {
  if (session.patient_name?.trim()) return session.patient_name.trim();
  if (session.chief_complaint?.trim()) {
    const brief = session.chief_complaint.trim();
    return brief.length > 48 ? `Guest — ${brief.slice(0, 45)}…` : `Guest — ${brief}`;
  }
  return "Guest (intake pending)";
}

export function DoctorTriageQueuePanel() {
  const { data, isLoading } = useListTriageSessionsQuery(undefined);

  const queue = (data?.sessions ?? [])
    .filter((session) => ACTIVE_STATUSES.has(session.triage_status ?? session.status ?? ""))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="size-5 text-primary" aria-hidden />
          AI triage queue
        </CardTitle>
        <CardDescription>Sessions needing review before consultation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading ? (
          <p className="text-muted-foreground">Loading triage sessions…</p>
        ) : queue.length === 0 ? (
          <p className="text-muted-foreground">No patients waiting in the AI triage queue.</p>
        ) : (
          queue.map((session) => (
            <div
              key={session.id}
              className="rounded-lg border border-border/60 px-3 py-2"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium">{triagePatientLabel(session)}</p>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {(session.triage_status ?? session.status ?? "active").replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {session.chief_complaint ?? session.ai_summary ?? "Awaiting triage summary."}
              </p>
            </div>
          ))
        )}
        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
          <Link href="/appointments">Open appointments</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
