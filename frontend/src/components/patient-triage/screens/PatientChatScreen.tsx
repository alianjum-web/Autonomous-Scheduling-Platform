"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Bot, Building2, Lock } from "lucide-react";

import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { PageShell } from "@/components/common/layout/PageShell";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { BAAComplianceBanner } from "@/components/common/molecules/BAAComplianceBanner";
import { useGetBAAStatusQuery } from "@/components/common/store/settingsApi";
import { LiveChatPanel } from "@/components/patient-triage/organisms/LiveChatPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PatientChatScreen() {
  const searchParams = useSearchParams();
  const staffNotice = searchParams.get("notice") === "staff_only";
  const { session, loading, tenantId, refreshSession } = useAuthSession();
  const { data: baa } = useGetBAAStatusQuery(undefined, { skip: !session || !tenantId });
  const chatBlocked = Boolean(session && tenantId && baa && !baa.ai_features_available);
  const needsOnboarding = Boolean(session && !loading && !tenantId);

  useEffect(() => {
    if (session && !tenantId && !loading) {
      void refreshSession();
    }
  }, [loading, refreshSession, session, tenantId]);

  return (
    <PageShell maxWidth="2xl" className="flex flex-1 flex-col gap-6 pb-12">
      <PageHeader
        eyebrow="Patient intake"
        title="AI Triage Chat"
        description="Describe your symptoms or scheduling needs. Our assistant uses your clinic's knowledge base and live availability to help you book the right appointment."
        imageKey="chat"
      />

      {staffNotice ? (
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="p-4 text-sm text-warning-foreground">
            Staff dashboards require a clinic admin role. Contact your administrator or complete
            onboarding as clinic staff.{" "}
            <Link href="/help" className="font-medium underline">
              Learn more
            </Link>
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
              <p className="font-medium">Sign in to start chatting</p>
              <p className="text-sm text-muted-foreground">
                A secure Supabase session is required to create triage sessions and send messages.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm">
                <Link href="/sign-in?next=/chat">Sign in</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </div>
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
              <p className="font-medium">Finish clinic onboarding</p>
              <p className="text-sm text-muted-foreground">
                Your account is signed in but not linked to a clinic yet. Complete onboarding so
                the API can create triage sessions.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/onboarding">Complete onboarding</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {session && tenantId ? <BAAComplianceBanner context="chat" /> : null}

      <div className="hero-glow overflow-hidden rounded-2xl">
        <LiveChatPanel disabled={(!loading && !session) || needsOnboarding || chatBlocked} />
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <Bot className="size-3.5" aria-hidden />
        For medical emergencies, call emergency services immediately — do not rely on chat alone.
      </p>
    </PageShell>
  );
}
