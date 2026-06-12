"use client";

import { ClipboardList, FileText } from "lucide-react";

import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { PageShell } from "@/components/common/layout/PageShell";
import { useListTriageSessionsQuery } from "@/components/common/store/staffApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DoctorTriageSessionsScreenProps {
  mode: "intake" | "triage";
}

export function DoctorTriageSessionsScreen({ mode }: DoctorTriageSessionsScreenProps) {
  const { isDoctor, loading } = useRoleGuard();
  const { session } = useAuthSession();
  const intakeOnly = mode === "intake";
  const { data, isLoading } = useListTriageSessionsQuery(
    { intakeOnly },
    { skip: !isDoctor },
  );

  if (loading) return <LoadingScreen message="Loading…" />;

  if (!session || !isDoctor) {
    return (
      <AccessGate
        title={intakeOnly ? "Intake forms" : "AI triage results"}
        description="Doctors only — view patient intake and triage summaries from your clinic."
        icon={intakeOnly ? <FileText className="size-8" /> : <ClipboardList className="size-8" />}
        imageKey="chat"
        signedIn={Boolean(session)}
      />
    );
  }

  const sessions = data?.sessions ?? [];

  return (
    <PageShell maxWidth="4xl" className="gap-8 pb-12">
      <PageHeader
        eyebrow="Doctor"
        title={intakeOnly ? "Intake forms" : "AI triage results"}
        description={
          intakeOnly
            ? "Patient intake submitted during public booking — no patient login required."
            : "Recent AI triage sessions from your clinic booking page and staff tools."
        }
        imageKey="chat"
      />

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No {intakeOnly ? "intake forms" : "triage sessions"} yet.
            </CardContent>
          </Card>
        ) : (
          sessions.map((sessionRow) => (
            <Card key={sessionRow.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {sessionRow.patient_name ?? "Anonymous visitor"}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {new Date(sessionRow.created_at).toLocaleString()} ·{" "}
                  {sessionRow.triage_status ?? sessionRow.status}
                  {sessionRow.source ? ` · ${sessionRow.source}` : ""}
                </p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {sessionRow.chief_complaint ? (
                  <p>
                    <span className="font-medium">Chief complaint:</span> {sessionRow.chief_complaint}
                  </p>
                ) : null}
                {sessionRow.ai_summary ? (
                  <p className="text-muted-foreground">{sessionRow.ai_summary}</p>
                ) : (
                  <p className="text-muted-foreground">No AI summary yet.</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageShell>
  );
}
