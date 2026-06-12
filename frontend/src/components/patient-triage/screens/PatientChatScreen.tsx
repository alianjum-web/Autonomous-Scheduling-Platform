"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bot, Building2, Lock } from "lucide-react";

import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import { PageShell } from "@/components/common/layout/PageShell";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { BAAComplianceBanner } from "@/components/common/molecules/BAAComplianceBanner";
import { useGetBAAStatusQuery } from "@/components/common/store/settingsApi";
import { LiveChatPanel } from "@/components/patient-triage/organisms/LiveChatPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Authenticated clinic staff AI triage — not the public patient booking flow. */
export function PatientChatScreen() {
  const searchParams = useSearchParams();
  const staffNotice = searchParams.get("notice") === "staff_only";
  const { session, loading, tenantId } = useAuthSession();
  const { isStaff, isDoctor, loading: roleLoading } = useRoleGuard();
  const { data: baa } = useGetBAAStatusQuery(undefined, { skip: !session || !tenantId });
  const chatBlocked = Boolean(session && tenantId && baa && !baa.ai_features_available);
  const needsOnboarding = Boolean(session && !loading && !tenantId);
  const canUseTriage = isStaff && !isDoctor;

  if (!loading && !roleLoading && session && isDoctor) {
    return (
      <AccessGate
        title="AI triage results"
        description="Doctors review triage in AI Triage Results. Use the dashboard for today's patients."
        icon={<Bot className="size-8" />}
        imageKey="chat"
        signedIn
      />
    );
  }

  return (
    <PageShell maxWidth="2xl" className="flex flex-1 flex-col gap-6 pb-12">
      <PageHeader
        eyebrow="Clinic staff"
        title="Staff triage"
        description="Internal triage workspace for clinic owners and admin staff. Patients book without accounts on your public clinic page."
        imageKey="chat"
      />

      {staffNotice ? (
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="p-4 text-sm text-warning-foreground">
            Clinic staff only. Patients should use your public booking page — no login required.
          </CardContent>
        </Card>
      ) : null}

      {!loading && !session ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="size-6" aria-hidden />
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-medium">Clinic sign-in required</p>
              <p className="text-sm text-muted-foreground">
                Staff triage is for authenticated clinic owners and front desk — not for patient self-signup.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/sign-in?next=/chat">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {needsOnboarding ? (
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning">
              <Building2 className="size-6" aria-hidden />
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-medium">Finish clinic setup</p>
              <p className="text-sm text-muted-foreground">
                Complete owner onboarding to link your account to a clinic workspace.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/onboarding">Complete onboarding</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {session && tenantId ? <BAAComplianceBanner context="chat" /> : null}

      {session && canUseTriage ? (
        <div className="hero-glow overflow-hidden rounded-2xl">
          <LiveChatPanel
            disabled={needsOnboarding || chatBlocked || loading || roleLoading}
          />
        </div>
      ) : null}

      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <Bot className="size-3.5" aria-hidden />
        Patients book at <Link href="/help" className="text-primary hover:underline">/clinic/your-slug</Link> without creating an account.
      </p>
    </PageShell>
  );
}
