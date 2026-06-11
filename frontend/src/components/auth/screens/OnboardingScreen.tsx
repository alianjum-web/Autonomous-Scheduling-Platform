"use client";

import { useOwnerOnboarding } from "@/components/auth/hooks/useOwnerOnboarding";
import { OwnerOnboardingWizard } from "@/components/auth/molecules/OwnerOnboardingWizard";

/** Clinic owner setup only — doctors use invitation flow; patients use public booking. */
export function OnboardingScreen() {
  const props = useOwnerOnboarding();
  if (props.loading) return null;
  return <OwnerOnboardingWizard {...props} />;
}
