"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  isDoctorOnboardingComplete,
} from "@/components/auth/hooks/useAcceptInvite";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";

const DOCTOR_SETUP_PATH = "/doctor/onboarding";

/** Redirect invited doctors to minimal onboarding until profile setup is done. */
export function useDoctorOnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, clinicRole, loading } = useAuthSession();

  useEffect(() => {
    if (loading || clinicRole !== "doctor" || !session?.user?.id) return;
    if (pathname === DOCTOR_SETUP_PATH) return;
    if (isDoctorOnboardingComplete(session.user.id)) return;
    router.replace(DOCTOR_SETUP_PATH);
  }, [clinicRole, loading, pathname, router, session?.user?.id]);
}
