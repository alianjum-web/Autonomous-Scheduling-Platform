import type { Session } from "@supabase/supabase-js";

import {
  isClinicRole,
  parseJwtPayload,
  type AppJwtPayload,
  type ClinicRole,
} from "@/types/auth";

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

export interface ProfileSnapshot {
  tenant_id?: string | null;
  role?: string | null;
}

const signedOutState = (initial: AuthState): AuthState => ({
  ...initial,
  loading: false,
  initialized: true,
});

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

function mergeProfileIntoAuthState(state: AuthState, profile?: ProfileSnapshot | null): AuthState {
  if (!profile) return state;
  const next = { ...state };
  if (profile.tenant_id) {
    next.tenantId = profile.tenant_id;
  }
  if (isClinicRole(profile.role)) {
    next.clinicRole = profile.role;
  }
  return next;
}

/** True when DB profile has tenant/role but the session JWT does not yet. */
export function sessionMissingProfileClaims(
  session: Session,
  profile: ProfileSnapshot | null | undefined,
): boolean {
  if (!profile) return false;
  const payload = parseJwtPayload(session.access_token);
  const hasTenant = Boolean(resolveTenantId(session, payload));
  const hasRole = Boolean(resolveClinicRole(session, payload));
  return Boolean((profile.tenant_id && !hasTenant) || (profile.role && !hasRole));
}

export function authStateFromSession(
  initial: AuthState,
  session: Session | null,
  profile?: ProfileSnapshot | null,
): AuthState {
  if (!session?.user) {
    return signedOutState(initial);
  }

  const payload = parseJwtPayload(session.access_token);

  return mergeProfileIntoAuthState(
    {
      ...initial,
      loading: false,
      initialized: true,
      accessToken: session.access_token ?? null,
      tenantId: resolveTenantId(session, payload),
      clinicRole: resolveClinicRole(session, payload),
      userId: session.user.id,
      email: session.user.email ?? null,
      fullName: (session.user.user_metadata?.full_name as string | undefined) ?? null,
    },
    profile,
  );
}
