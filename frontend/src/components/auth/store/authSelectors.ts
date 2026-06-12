import { createSelector } from "@reduxjs/toolkit";
import type { Session } from "@supabase/supabase-js";

import type { RootState } from "@/components/common/store";
import type { ClinicRole } from "@/types/auth";
import { defaultHomeForRole, dashboardHrefForAuth } from "@/lib/nav/roleNav";

import { CLINIC_MANAGER_ROLES, DOCTOR_ROLES, OWNER_ROLES, STAFF_ROLES } from "./authRoles";

export const selectAuth = (state: RootState) => state.auth;

export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthInitialized = (state: RootState) => state.auth.initialized;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectTenantId = (state: RootState) => state.auth.tenantId;
export const selectClinicRole = (state: RootState): ClinicRole | null => state.auth.clinicRole;
export const selectIsAuthenticated = (state: RootState) =>
  Boolean(state.auth.userId && state.auth.accessToken);

export const selectIsStaff = createSelector([selectClinicRole], (role) =>
  role ? STAFF_ROLES.has(role) : false,
);

export const selectIsOwner = createSelector([selectClinicRole], (role) =>
  role ? OWNER_ROLES.has(role) : false,
);

export const selectIsClinicManager = createSelector([selectClinicRole], (role) =>
  role ? CLINIC_MANAGER_ROLES.has(role) : false,
);

export const selectIsDoctor = createSelector([selectClinicRole], (role) =>
  role ? DOCTOR_ROLES.has(role) : false,
);

export const selectDefaultHome = createSelector(
  [selectClinicRole, selectTenantId],
  (role, tenantId) => defaultHomeForRole(role, tenantId),
);

export const selectDashboardHref = createSelector(
  [selectIsAuthenticated, selectClinicRole, selectTenantId],
  (isAuthenticated, role, tenantId) => dashboardHrefForAuth(isAuthenticated, role, tenantId),
);

/** True once we know the signed-in user's clinic role (or they are signed out). */
export const selectAuthProfileReady = createSelector(
  [selectIsAuthenticated, selectAuthInitialized, selectClinicRole],
  (isAuthenticated, initialized, role) => !isAuthenticated || (initialized && role !== null),
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
