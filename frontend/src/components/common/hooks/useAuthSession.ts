"use client";

import { useCallback } from "react";

import { selectAccessToken, selectAuthLoading, selectAuthSession, selectTenantId } from "@/components/auth/store/authSelectors";
import { setSession } from "@/components/auth/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/components/common/store/hooks";
import { createClient } from "@/lib/supabase/client";

export function useAuthSession() {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectAuthSession);
  const loading = useAppSelector(selectAuthLoading);
  const tenantId = useAppSelector(selectTenantId);
  const accessToken = useAppSelector(selectAccessToken);

  const refreshSession = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.refreshSession();
    dispatch(setSession(data.session));
    return data.session;
  }, [dispatch]);

  return {
    session,
    loading,
    tenantId,
    accessToken,
    refreshSession,
  };
}
