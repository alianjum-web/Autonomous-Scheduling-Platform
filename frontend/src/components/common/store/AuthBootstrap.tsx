"use client";

import { useEffect, type ReactNode } from "react";

import { createClient } from "@/lib/supabase/client";

import { setSession } from "./authSlice";
import { useAppDispatch } from "./hooks";
import { resetFeatureState } from "./resetFeatureState";

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
