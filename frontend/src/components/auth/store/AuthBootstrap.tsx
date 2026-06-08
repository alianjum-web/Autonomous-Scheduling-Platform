"use client";

import { useEffect, type ReactNode } from "react";

import { useAppDispatch } from "@/components/common/store/hooks";
import { resetFeatureState } from "@/components/common/store/resetFeatureState";
import { createClient } from "@/lib/supabase/client";

import { setSession } from "./authSlice";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      dispatch(setSession(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        resetFeatureState(dispatch);
        return;
      }
      dispatch(setSession(session));
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
}
