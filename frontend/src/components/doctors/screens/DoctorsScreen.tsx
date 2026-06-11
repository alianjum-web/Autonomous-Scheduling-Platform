"use client";

import { Stethoscope } from "lucide-react";

import { DoctorsInvitePanel } from "@/components/common/molecules/DoctorsInvitePanel";
import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { PageShell } from "@/components/common/layout/PageShell";

export function DoctorsScreen() {
  const { isOwner, loading } = useRoleGuard();
  const { session } = useAuthSession();

  if (loading) return <LoadingScreen message="Loading doctors…" />;

  if (!session) {
    return (
      <AccessGate
        title="Sign in required"
        description="Clinic owners manage doctors from this page."
        icon={<Stethoscope className="size-8" />}
        imageKey="auth"
      />
    );
  }

  if (!isOwner) {
    return (
      <AccessGate
        title="Owner access only"
        description="Only the clinic owner can invite and remove doctors."
        icon={<Stethoscope className="size-8" />}
        imageKey="auth"
        signedIn
      />
    );
  }

  return (
    <PageShell maxWidth="2xl" className="gap-8 pb-12">
      <PageHeader
        eyebrow="Clinic team"
        title="Doctors"
        description="Invite providers by email. They accept the invite, set a password, and manage their own schedule."
        imageKey="auth"
      />
      <DoctorsInvitePanel />
    </PageShell>
  );
}
