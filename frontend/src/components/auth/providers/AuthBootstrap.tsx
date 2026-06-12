"use client";

import { useEffect, type ReactNode } from "react";

import { useAppDispatch } from "@/components/common/store/hooks";
import { resetFeatureState } from "@/components/common/store/resetFeatureState";
import { createClient } from "@/lib/supabase/client";

import { resetAuthSyncState, syncAuthSession } from "../session/syncAuthSession";
import { setSession } from "../store/authSlice";

/**
 * Subscribes to Supabase auth events and hydrates the auth slice.
 * Mount only via `StoreProvider` — not in individual pages or layouts.
 */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        resetAuthSyncState();
        dispatch(setSession(null));
        resetFeatureState(dispatch);
        return;
      }
      // INITIAL_SESSION fires on subscribe — do not also call getSession() (duplicate sync).
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        void syncAuthSession(dispatch, session);
        return;
      }
      if (event === "TOKEN_REFRESHED" && session) {
        dispatch(setSession(session));
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return children;
}
