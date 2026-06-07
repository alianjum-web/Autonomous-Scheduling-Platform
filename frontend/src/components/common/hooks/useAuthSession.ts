"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const refreshSession = useCallback(async () => {
    const { data } = await supabase.auth.refreshSession();
    setSession(data.session);
    return data.session;
  }, [supabase.auth]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const tenantId =
    session?.user?.app_metadata?.tenant_id ??
    (session?.access_token
      ? JSON.parse(atob(session.access_token.split(".")[1] ?? ""))?.tenant_id
      : null);

  return {
    session,
    loading,
    tenantId: tenantId as string | null,
    accessToken: session?.access_token ?? null,
    refreshSession,
  };
}
