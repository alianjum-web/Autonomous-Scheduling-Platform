"use client";

import { OwnerOnboardingWizard, useOwnerOnboarding } from "@/components/auth";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";

/** Clinic owner setup only — doctors use invitation flow; patients use public booking. */
export function OnboardingScreen() {
  const props = useOwnerOnboarding();
  const { clinicRole } = useAuthSession();

  if (props.loading) return <LoadingScreen message="Loading…" />;
  if (clinicRole === "doctor") {
    return <LoadingScreen message="Redirecting to doctor setup…" />;
  }

  return <OwnerOnboardingWizard {...props} />;
}
