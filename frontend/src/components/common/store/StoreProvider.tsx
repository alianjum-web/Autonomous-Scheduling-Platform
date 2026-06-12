"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";

import { AuthBootstrap } from "@/components/auth/providers";

import { makeStore } from "./index";

/**
 * App-wide Redux provider.
 *
 * Provider tree:
 *   StoreProvider (Redux)
 *     └── AuthBootstrap (Supabase auth → auth slice)
 *           └── pages
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => makeStore());

  return (
    <Provider store={store}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </Provider>
  );
}
