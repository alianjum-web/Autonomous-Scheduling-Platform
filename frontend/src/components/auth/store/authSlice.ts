import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Session } from "@supabase/supabase-js";

export const ADMIN_ROLES = new Set(["admin", "clinic_admin"]);

export interface AuthState {
  loading: boolean;
  initialized: boolean;
  accessToken: string | null;
  tenantId: string | null;
  clinicRole: string | null;
  userId: string | null;
  email: string | null;
  fullName: string | null;
}

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

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(token.split(".")[1] ?? "")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveTenantId(session: Session): string | null {
  const fromMeta = session.user?.app_metadata?.tenant_id;
  if (typeof fromMeta === "string" && fromMeta) return fromMeta;
  const payload = parseJwtPayload(session.access_token);
  const fromJwt = payload?.tenant_id;
  return typeof fromJwt === "string" ? fromJwt : null;
}

function resolveClinicRole(session: Session): string | null {
  const fromMeta = session.user?.app_metadata?.role;
  if (typeof fromMeta === "string" && fromMeta) return fromMeta;
  const payload = parseJwtPayload(session.access_token);
  if (!payload) return null;
  const direct = payload.clinic_role;
  if (typeof direct === "string") return direct;
  const appMeta = payload.app_metadata as { role?: string } | undefined;
  return appMeta?.role ?? null;
}

export function authStateFromSession(session: Session | null): AuthState {
  if (!session?.user) {
    return { ...initialState, loading: false, initialized: true };
  }

  return {
    loading: false,
    initialized: true,
    accessToken: session.access_token ?? null,
    tenantId: resolveTenantId(session),
    clinicRole: resolveClinicRole(session),
    userId: session.user.id,
    email: session.user.email ?? null,
    fullName: (session.user.user_metadata?.full_name as string | undefined) ?? null,
  };
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setSession(state, action: PayloadAction<Session | null>) {
      return authStateFromSession(action.payload);
    },
    clearAuth() {
      return { ...initialState, loading: false, initialized: true };
    },
  },
});

export const { setAuthLoading, setSession, clearAuth } = authSlice.actions;
export default authSlice.reducer;
