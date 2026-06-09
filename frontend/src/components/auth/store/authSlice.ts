import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Session } from "@supabase/supabase-js";

import {
  isClinicRole,
  parseJwtPayload,
  type AppJwtPayload,
  type ClinicRole,
} from "@/types/auth";

export const ADMIN_ROLES = new Set<ClinicRole>(["admin", "clinic_admin"]);

export interface AuthState {
  loading: boolean;
  initialized: boolean;
  accessToken: string | null;
  tenantId: string | null;
  clinicRole: ClinicRole | null;
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

function resolveTenantId(session: Session, payload: AppJwtPayload | null): string | null {
  const fromMeta = session.user?.app_metadata?.tenant_id;
  if (typeof fromMeta === "string" && fromMeta) return fromMeta;
  const fromJwt = payload?.tenant_id;
  return typeof fromJwt === "string" ? fromJwt : null;
}

function resolveClinicRole(session: Session, payload: AppJwtPayload | null): ClinicRole | null {
  const fromMeta = session.user?.app_metadata?.role;
  if (isClinicRole(fromMeta)) return fromMeta;
  if (!payload) return null;
  if (isClinicRole(payload.clinic_role)) return payload.clinic_role;
  if (isClinicRole(payload.app_metadata?.role)) return payload.app_metadata.role;
  return null;
}

export function authStateFromSession(session: Session | null): AuthState {
  if (!session?.user) {
    return { ...initialState, loading: false, initialized: true };
  }

  const payload = parseJwtPayload(session.access_token);

  return {
    loading: false,
    initialized: true,
    accessToken: session.access_token ?? null,
    tenantId: resolveTenantId(session, payload),
    clinicRole: resolveClinicRole(session, payload),
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
