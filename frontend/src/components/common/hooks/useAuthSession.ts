"use client";

import { useCallback } from "react";

import { selectClinicRole, selectAccessToken, selectAuthLoading, selectAuthSession, selectTenantId } from "@/components/auth/store/authSelectors";
import { setSession } from "@/components/auth/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/components/common/store/hooks";
import { createClient } from "@/lib/supabase/client";
import { refreshAuthSessionOnce } from "@/lib/supabase/sessionRefresh";
import type { ClinicRole } from "@/types/auth";
import type { UseAuthSessionReturn } from "@/types/hooks";

export function useAuthSession(): UseAuthSessionReturn & { clinicRole: ClinicRole | null } {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectAuthSession);
  const loading = useAppSelector(selectAuthLoading);
  const tenantId = useAppSelector(selectTenantId);
  const accessToken = useAppSelector(selectAccessToken);
  const clinicRole = useAppSelector(selectClinicRole);

  const refreshSession = useCallback(async () => {
    const supabase = createClient();
    const session = await refreshAuthSessionOnce(supabase);
    if (session) {
      dispatch(setSession(session));
    }
    return session;
  }, [dispatch]);

  return {
    session,
    loading,
    tenantId,
    accessToken,
    clinicRole,
    refreshSession,
  };
}
