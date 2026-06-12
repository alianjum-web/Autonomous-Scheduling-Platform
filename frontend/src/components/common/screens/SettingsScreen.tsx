"use client";

import { useEffect } from "react";
import { User } from "lucide-react";

import { selectIsAuthenticated, selectTenantId } from "@/components/auth/store/authSelectors";
import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { BAASettingsPanel } from "@/components/common/molecules/BAASettingsPanel";
import { BookingPagePanel } from "@/components/common/molecules/BookingPagePanel";
import { CalendarConfigPanel } from "@/components/common/molecules/CalendarConfigPanel";
import { ClinicSetupRequiredCard } from "@/components/common/molecules/ClinicSetupRequiredCard";
import { ComplianceAuditPanel } from "@/components/common/molecules/ComplianceAuditPanel";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { SettingsProfileCard } from "@/components/common/molecules/SettingsProfileCard";
import { SettingsSecurityCard } from "@/components/common/molecules/SettingsSecurityCard";
import { SettingsWorkspaceCard } from "@/components/common/molecules/SettingsWorkspaceCard";
import { StaffPreferencesCard } from "@/components/common/molecules/StaffPreferencesCard";
import { DoctorProfileCard } from "@/components/doctors/molecules/DoctorProfileCard";
import { useGetMyProviderQuery } from "@/components/common/store/staffApi";
import { useSettingsActions } from "@/components/common/hooks/useSettingsActions";
import { PageShell } from "@/components/common/layout/PageShell";
import { useAppSelector } from "@/components/common/store/hooks";
import { useGetUserProfileQuery } from "@/components/common/store/settingsApi";

export function SettingsScreen() {
  const { session, loading: authLoading } = useAuthSession();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const tenantId = useAppSelector(selectTenantId);
  const { clinicRole, isOwner, isClinicManager, isDoctor } = useRoleGuard();
  const { data: provider } = useGetMyProviderQuery(undefined, { skip: !isDoctor });
  const {
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useGetUserProfileQuery(undefined, { skip: !isAuthenticated });
  const {
    profile,
    baaStatus,
    baaLoading,
    acknowledgingBAA,
    handleSignOut,
    handleAcknowledgeBAA,
  } = useSettingsActions();

  const workspaceSlug = profile?.workspaceSlug ?? null;
  const hasTenantLink = Boolean(tenantId);
  const workspaceLoaded = Boolean(workspaceSlug && profile?.clinicName);
  const clinicName =
    profile?.clinicName ?? (workspaceLoaded ? "Your clinic" : "Not configured");

  useEffect(() => {
    if (isAuthenticated && tenantId && !workspaceSlug) {
      void refetchProfile();
    }
  }, [isAuthenticated, tenantId, workspaceSlug, refetchProfile]);

  if (authLoading || profileLoading) return <LoadingScreen message="Loading settings…" />;

  if (!isAuthenticated) {
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
          email={profile?.email ?? session?.user.email ?? "—"}
          fullName={
            profile?.fullName ??
            ((session?.user.user_metadata?.full_name as string) || "—")
          }
          role={clinicRole ?? profile?.role ?? "patient"}
        />

        {isDoctor ? <DoctorProfileCard provider={provider} /> : null}

        {!isDoctor ? (
          <SettingsWorkspaceCard
            clinicName={clinicName}
            workspaceSlug={workspaceSlug}
            configured={workspaceLoaded}
            syncing={hasTenantLink && !workspaceLoaded}
          />
        ) : null}

        {!isDoctor && isClinicManager && !hasTenantLink ? (
          <ClinicSetupRequiredCard isOwner={isOwner} />
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

        {isClinicManager && hasTenantLink ? <BookingPagePanel /> : null}

        {isOwner ? (
          <>
            <CalendarConfigPanel />
            <ComplianceAuditPanel />
            <StaffPreferencesCard />
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
