"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  selectAuthLoading,
  selectClinicRole,
  selectIsAuthenticated,
  selectTenantId,
} from "@/components/auth/store/authSelectors";
import { isDoctorOnboardingComplete } from "@/components/auth/hooks/useAcceptInvite";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { useAppSelector } from "@/components/common/store/hooks";

const OWNER_HOME = "/front-desk";
const DOCTOR_HOME = "/doctor";
const DOCTOR_SETUP = "/doctor/onboarding";

/** Client-side safety net — keeps doctors off owner routes when proxy is slow or role loads late. */
export function useRoleHomeGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const authLoading = useAppSelector(selectAuthLoading);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const clinicRole = useAppSelector(selectClinicRole);
  const tenantId = useAppSelector(selectTenantId);
  const { session } = useAuthSession();

  useEffect(() => {
    if (authLoading || !isAuthenticated || !clinicRole) return;

    const userId = session?.user?.id;

    if (clinicRole === "doctor") {
      const needsSetup = userId && !isDoctorOnboardingComplete(userId);
      const doctorDestination = needsSetup ? DOCTOR_SETUP : DOCTOR_HOME;

      if (pathname === "/front-desk" || pathname === "/onboarding") {
        router.replace(doctorDestination);
        return;
      }

      if (
        needsSetup &&
        pathname !== DOCTOR_SETUP &&
        !pathname.startsWith("/accept-invite") &&
        !pathname.startsWith("/sign-")
      ) {
        router.replace(DOCTOR_SETUP);
      }
      return;
    }

    if (clinicRole === "admin" || clinicRole === "clinic_admin") {
      if (pathname === "/onboarding" && tenantId) {
        router.replace(OWNER_HOME);
        return;
      }
      if (pathname === DOCTOR_HOME || pathname.startsWith("/doctor/")) {
        router.replace(OWNER_HOME);
      }
    }
  }, [authLoading, clinicRole, isAuthenticated, pathname, router, session?.user?.id, tenantId]);
}
