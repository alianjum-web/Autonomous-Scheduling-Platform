"use client";

import { useEffect, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import type { AppDispatch } from "@/components/common/store";
import { useAppDispatch } from "@/components/common/store/hooks";
import { resetFeatureState } from "@/components/common/store/resetFeatureState";
import { createClient } from "@/lib/supabase/client";
import { fetchUserProfile } from "@/lib/supabase/onboarding";

import { applyProfileFromDb, setSession } from "./authSlice";

async function syncAuthSession(dispatch: AppDispatch, session: Session | null) {
  dispatch(setSession(session));
  if (!session?.user) return;

  const profileData = await fetchUserProfile();
  if (profileData?.profile) {
    dispatch(
      applyProfileFromDb({
        tenant_id: profileData.profile.tenant_id,
        role: profileData.profile.role,
      }),
    );
  }
}

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        dispatch(setSession(null));
        return;
      }
      void supabase.auth.getSession().then(({ data }) => {
        void syncAuthSession(dispatch, data.session);
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        dispatch(setSession(null));
        resetFeatureState(dispatch);
        return;
      }
      void syncAuthSession(dispatch, session);
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
}
