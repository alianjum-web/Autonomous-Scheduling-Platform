import { isDoctorOnboardingComplete } from "@/components/auth/hooks/useAcceptInvite";
import { defaultHomeForRole } from "@/lib/nav/roleNav";
import { isClinicRole, type ClinicRole } from "@/types/auth";

export interface PostAuthProfile {
  role?: string | null;
  tenant_id?: string | null;
  userId?: string | null;
}

/** Where to send the user immediately after sign-in or invite acceptance. */
export function postAuthPath(
  profile: PostAuthProfile,
  explicitNext?: string | null,
): string {
  if (explicitNext && explicitNext.startsWith("/") && !explicitNext.startsWith("//")) {
    const role: ClinicRole | null = isClinicRole(profile.role) ? profile.role : null;
    const ownerOnly =
      explicitNext === "/front-desk" ||
      explicitNext === "/onboarding" ||
      explicitNext.startsWith("/doctors");
    if (role === "doctor" && ownerOnly) {
      // Ignore stale ?next= links that target owner routes.
    } else {
      return explicitNext;
    }
  }

  const role: ClinicRole | null = isClinicRole(profile.role) ? profile.role : null;
  const tenantId = profile.tenant_id ?? null;

  if (role === "doctor") {
    if (profile.userId && !isDoctorOnboardingComplete(profile.userId)) {
      return "/doctor/onboarding";
    }
    return "/doctor";
  }

  if (!tenantId) {
    return "/onboarding";
  }

  return defaultHomeForRole(role, tenantId);
}
