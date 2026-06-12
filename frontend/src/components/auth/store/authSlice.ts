import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Session } from "@supabase/supabase-js";

import {
  authStateFromSession,
  type AuthState,
  type ProfileSnapshot,
} from "./authState";

export type { AuthState, ProfileSnapshot };

const initialState: AuthState = {
  loading: true,
  initialized: false,
  accessToken: null,
  tenantId: null,
  clinicRole: null,
  userId: null,
  email: null,
  fullName: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setSession(
      state,
      action: PayloadAction<Session | null | { session: Session; profile?: ProfileSnapshot | null }>,
    ) {
      const payload = action.payload;
      if (payload && typeof payload === "object" && "session" in payload) {
        return authStateFromSession(initialState, payload.session, payload.profile);
      }
      const next = authStateFromSession(initialState, payload as Session | null);
      if (next.userId && next.userId === state.userId) {
        return {
          ...next,
          clinicRole: next.clinicRole ?? state.clinicRole,
          tenantId: next.tenantId ?? state.tenantId,
        };
      }
      return next;
    },
    clearAuth() {
      return { ...initialState, loading: false, initialized: true };
    },
  },
});

export const { setAuthLoading, setSession, clearAuth } = authSlice.actions;
export default authSlice.reducer;
