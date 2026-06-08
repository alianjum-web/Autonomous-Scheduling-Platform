import { createSelector } from "@reduxjs/toolkit";
import type { Session } from "@supabase/supabase-js";

import type { RootState } from "./index";

import { ADMIN_ROLES } from "./authSlice";

export const selectAuth = (state: RootState) => state.auth;

export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthInitialized = (state: RootState) => state.auth.initialized;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectTenantId = (state: RootState) => state.auth.tenantId;
export const selectClinicRole = (state: RootState) => state.auth.clinicRole;
export const selectIsAuthenticated = (state: RootState) => Boolean(state.auth.userId);

export const selectIsAdmin = createSelector([selectClinicRole], (role) =>
  role ? ADMIN_ROLES.has(role) : false,
);

/** Reconstructs a minimal Supabase Session for legacy consumers. */
export const selectAuthSession = createSelector([selectAuth], (auth): Session | null => {
  if (!auth.userId || !auth.accessToken) return null;

  return {
    access_token: auth.accessToken,
    refresh_token: "",
    expires_in: 0,
    token_type: "bearer",
    user: {
      id: auth.userId,
      email: auth.email ?? undefined,
      app_metadata: {
        tenant_id: auth.tenantId,
        role: auth.clinicRole,
      },
      user_metadata: {
        full_name: auth.fullName,
      },
      aud: "authenticated",
      created_at: "",
    },
  } as Session;
});
