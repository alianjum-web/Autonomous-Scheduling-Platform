"use client";

import { CreditCard } from "lucide-react";

import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { PageShell } from "@/components/common/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function BillingScreen() {
  const { isOwner } = useRoleGuard();
  const { session } = useAuthSession();

  if (!session) {
    return (
      <AccessGate
        title="Billing"
        description="Sign in as clinic owner to manage subscription."
        icon={<CreditCard className="size-8" />}
        imageKey="auth"
      />
    );
  }

  if (!isOwner) {
    return (
      <AccessGate
        title="Owner only"
        description="Billing is managed by the clinic owner."
        icon={<CreditCard className="size-8" />}
        imageKey="auth"
        signedIn
      />
    );
  }

  return (
    <PageShell maxWidth="2xl" className="gap-8 pb-12">
      <PageHeader
        eyebrow="Account"
        title="Billing"
        description="Subscription and invoicing for your clinic workspace."
        imageKey="auth"
      />
      <Card>
        <CardHeader>
          <CardTitle>Symptra Pro — Demo plan</CardTitle>
          <CardDescription>
            Stripe billing integration is ready to connect. This demo workspace includes AI triage,
            booking, and multi-doctor scheduling.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Current plan: <strong className="text-foreground">Starter (MVP demo)</strong></p>
          <p>Includes: unlimited doctors, public booking page, HIPAA BAA workflow, Google Calendar.</p>
          <Button variant="outline" disabled>
            Connect Stripe (coming soon)
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
