"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bot, Lock } from "lucide-react";

import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { PageHeader, PageShell } from "@/components/common/layout/PageShell";
import { LiveChatPanel } from "@/components/patient-triage/organisms/LiveChatPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IMAGES } from "@/lib/constants/images";

export function PatientChatScreen() {
  const searchParams = useSearchParams();
  const staffNotice = searchParams.get("notice") === "staff_only";
  const { session, loading } = useAuthSession();

  return (
    <PageShell maxWidth="2xl" className="flex flex-1 flex-col gap-6 pb-12">
      <PageHeader
        eyebrow="Patient intake"
        title="AI Triage Chat"
        description="Describe your symptoms or scheduling needs. Our assistant uses your clinic's knowledge base and live availability to help you book the right appointment."
        image={IMAGES.chat}
        imageAlt="Patient speaking with healthcare provider"
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

      <div className="hero-glow overflow-hidden rounded-2xl">
        <LiveChatPanel disabled={!loading && !session} />
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <Bot className="size-3.5" aria-hidden />
        For medical emergencies, call emergency services immediately — do not rely on chat alone.
      </p>
    </PageShell>
  );
}
