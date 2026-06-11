"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { usePreviewStaffInviteQuery } from "@/components/common/store/staffApi";
import { acceptStaffInvite } from "@/lib/supabase/staffInvite";

const DOCTOR_ONBOARDING_KEY = "symptra_doctor_onboarding_done";

export function isDoctorOnboardingComplete(userId: string | null): boolean {
  if (!userId || typeof window === "undefined") return false;
  return sessionStorage.getItem(`${DOCTOR_ONBOARDING_KEY}:${userId}`) === "1";
}

export function markDoctorOnboardingComplete(userId: string) {
  sessionStorage.setItem(`${DOCTOR_ONBOARDING_KEY}:${userId}`, "1");
}

export function useAcceptInvite(token: string) {
  const router = useRouter();
  const { session, loading: authLoading, clinicRole } = useAuthSession();
  const { data: preview, isLoading: previewLoading, error } = usePreviewStaffInviteQuery(token, {
    skip: !token,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!authLoading && !session && token) {
      router.replace(
        `/sign-up?invite=${encodeURIComponent(token)}&next=${encodeURIComponent(`/accept-invite?token=${token}`)}`,
      );
    }
  }, [authLoading, router, session, token]);

  const onAccept = async () => {
    if (!token) return;
    setSubmitError(null);
    setAccepting(true);
    try {
      await acceptStaffInvite(token);
      const isDoctor = preview?.role === "doctor" || clinicRole === "doctor";
      router.push(isDoctor ? "/doctor/onboarding" : "/front-desk");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not accept invite.");
    } finally {
      setAccepting(false);
    }
  };

  return {
    preview,
    previewLoading,
    previewError: error,
    authLoading,
    submitError,
    accepting,
    onAccept,
    signUpHref: `/sign-up?invite=${encodeURIComponent(token)}&next=${encodeURIComponent(`/accept-invite?token=${token}`)}`,
    signInHref: `/sign-in?next=${encodeURIComponent(`/accept-invite?token=${token}`)}`,
  };
}
