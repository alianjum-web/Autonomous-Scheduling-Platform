"use client";

import { User } from "lucide-react";

import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { BAASettingsPanel } from "@/components/common/molecules/BAASettingsPanel";
import { BookingPagePanel } from "@/components/common/molecules/BookingPagePanel";
import { CalendarConfigPanel } from "@/components/common/molecules/CalendarConfigPanel";
import { ComplianceAuditPanel } from "@/components/common/molecules/ComplianceAuditPanel";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { SettingsProfileCard } from "@/components/common/molecules/SettingsProfileCard";
import { SettingsSecurityCard } from "@/components/common/molecules/SettingsSecurityCard";
import { SettingsWorkspaceCard } from "@/components/common/molecules/SettingsWorkspaceCard";
import { StaffPreferencesCard } from "@/components/common/molecules/StaffPreferencesCard";
import { useSettingsActions } from "@/components/common/hooks/useSettingsActions";
import { PageShell } from "@/components/common/layout/PageShell";
import { useGetUserProfileQuery } from "@/components/common/store/settingsApi";

export function SettingsScreen() {
  const { session, loading: authLoading } = useAuthSession();
  const { clinicRole, isOwner, isDoctor } = useRoleGuard();
  const { isLoading: profileLoading } = useGetUserProfileQuery(undefined, { skip: !session });
  const {
    profile,
    baaStatus,
    baaLoading,
    acknowledgingBAA,
    handleSignOut,
    handleAcknowledgeBAA,
  } = useSettingsActions();

  if (authLoading || profileLoading) return <LoadingScreen message="Loading settings…" />;

  if (!session) {
    return (
      <AccessGate
        title="Sign in to manage settings"
        description="Account settings require an authenticated session."
        icon={<User className="size-8" />}
        imageKey="auth"
      />
    );
  }

  return (
    <PageShell maxWidth="2xl" className="gap-8 pb-12">
      <PageHeader
        eyebrow={isDoctor ? "Doctor" : "Account"}
        title={isDoctor ? "Profile" : "Settings"}
        description={
          isDoctor
            ? "Your doctor profile and account security."
            : "Manage your profile, workspace, and clinic configuration."
        }
        imageKey="auth"
      />

      <div className="grid gap-6">
        <SettingsProfileCard
          email={profile?.email ?? session.user.email ?? "—"}
          fullName={
            profile?.fullName ??
            ((session.user.user_metadata?.full_name as string) || "—")
          }
          role={clinicRole ?? profile?.role ?? "patient"}
        />

        {!isDoctor ? (
          <SettingsWorkspaceCard
            clinicName={profile?.clinicName ?? "Not configured"}
            workspaceSlug={profile?.workspaceSlug ?? "—"}
          />
        ) : null}

        <SettingsSecurityCard onSignOut={() => void handleSignOut()} />

        {isOwner ? (
          <BAASettingsPanel
            baaStatus={baaStatus}
            isLoading={baaLoading}
            isAdmin={isOwner}
            acknowledging={acknowledgingBAA}
            onAcknowledge={handleAcknowledgeBAA}
          />
        ) : null}

        {isOwner ? (
          <>
            <BookingPagePanel />
            <CalendarConfigPanel />
            <ComplianceAuditPanel />
            <StaffPreferencesCard />
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
