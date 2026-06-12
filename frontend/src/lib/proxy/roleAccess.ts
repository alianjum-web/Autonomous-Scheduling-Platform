/**
 * Role + route access rules for the Next.js proxy (middleware).
 * Single source of truth — keep in sync with `lib/nav/roleNav.ts` for client nav.
 */

import type { ClinicRole } from "@/types/auth";
import { isClinicRole } from "@/types/auth";
import {
  defaultHomeForRole,
  DOCTOR_ONLY_ROUTES,
  OWNER_ADMIN_ROUTES,
  OWNER_ONLY_ROUTES,
} from "@/lib/nav/roleNav";

/** Roles that may access staff workspace routes. */
export type StaffRole = Extract<ClinicRole, "admin" | "clinic_admin" | "doctor">;

/** Minimal profile fields loaded in the proxy for access decisions. */
export interface ProxyProfile {
  tenant_id: string | null;
  role: ClinicRole | null;
}

/** Route classification for a request pathname. */
export interface RouteFlags {
  isAuthRoute: boolean;
  isPublic: boolean;
  needsAuth: boolean;
}

/** Why the proxy chose to redirect (debugging / tests). */
export type RoleRedirectReason =
  | "missing_tenant"
  | "non_owner_onboarding"
  | "non_staff_auth"
  | "doctor_front_desk"
  | "owner_doctor_route"
  | "non_owner_restricted"
  | "doctor_clinic_docs"
  | "doctor_owner_onboarding"
  | "owner_doctor_onboarding"
  | "doctor_ai_triage"
  | "non_owner_ai_triage";

/** A role-based redirect decision — `null` means allow the request through. */
export interface RoleRedirect {
  destination: string;
  reason: RoleRedirectReason;
}

export const AUTH_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/onboarding",
  "/accept-invite",
  "/doctor/onboarding",
  "/auth/",
] as const;

export const PUBLIC_ROUTES = [
  "/",
  "/privacy",
  "/terms",
  "/hipaa-notice",
  "/help",
  "/status",
  "/clinic",
] as const;

export const PROTECTED_ROUTES = [
  "/chat",
  "/front-desk",
  "/appointments",
  "/clinic-docs",
  "/settings",
  "/onboarding",
  "/doctors",
  "/doctor",
  "/doctor/onboarding",
  "/schedule",
  "/patients",
  "/billing",
  "/doctor/intake",
  "/doctor/triage",
] as const;

export function normalizeProfileRole(role: string | null | undefined): ClinicRole | null {
  return isClinicRole(role) ? role : null;
}

export function toProxyProfile(
  row: { tenant_id?: string | null; role?: string | null } | null,
): ProxyProfile | null {
  if (!row) return null;
  return {
    tenant_id: row.tenant_id ?? null,
    role: normalizeProfileRole(row.role),
  };
}

export function isStaffRole(role: ClinicRole | null): role is StaffRole {
  return role === "admin" || role === "clinic_admin" || role === "doctor";
}

export function isRouteMatch(pathname: string, routes: readonly string[]): boolean {
  return routes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`) ||
      (route.endsWith("/") && pathname.startsWith(route)),
  );
}

export function classifyRoute(pathname: string): RouteFlags {
  return {
    isAuthRoute: isRouteMatch(pathname, AUTH_ROUTES),
    isPublic: PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    ),
    needsAuth: PROTECTED_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    ),
  };
}

/**
 * Returns a redirect when the signed-in user's role may not access `pathname`.
 * Returns `null` when the request should proceed.
 */
export function resolveRoleRedirect(
  pathname: string,
  profile: ProxyProfile | null,
  options: { needsAuth: boolean },
): RoleRedirect | null {
  if (!profile) return null;

  const { needsAuth } = options;
  const { role, tenant_id: tenantId } = profile;
  const home = defaultHomeForRole(role, tenantId);

  if (
    !tenantId &&
    pathname !== "/onboarding" &&
    pathname !== "/accept-invite" &&
    pathname !== "/doctor/onboarding"
  ) {
    return { destination: "/onboarding", reason: "missing_tenant" };
  }

  if (role === "doctor" && pathname === "/onboarding") {
    return {
      destination: tenantId ? "/doctor/onboarding" : "/accept-invite",
      reason: "doctor_owner_onboarding",
    };
  }

  if (role === "admin" && pathname === "/doctor/onboarding") {
    return { destination: "/front-desk", reason: "owner_doctor_onboarding" };
  }

  // Staff must join via invite — only owners create clinics on /onboarding.
  if (
    pathname === "/onboarding" &&
    !tenantId &&
    role &&
    (role === "doctor" || role === "clinic_admin")
  ) {
    return { destination: "/accept-invite", reason: "non_owner_onboarding" };
  }

  if (role === "doctor" && isRouteMatch(pathname, OWNER_ADMIN_ROUTES)) {
    return { destination: "/doctor/triage", reason: "doctor_ai_triage" };
  }

  if (role && role !== "admin" && role !== "clinic_admin" && isRouteMatch(pathname, OWNER_ADMIN_ROUTES)) {
    return { destination: home, reason: "non_owner_ai_triage" };
  }

  if (role === "doctor" && pathname === "/front-desk") {
    return { destination: "/doctor", reason: "doctor_front_desk" };
  }

  if (role === "admin" && isRouteMatch(pathname, DOCTOR_ONLY_ROUTES)) {
    return { destination: "/front-desk", reason: "owner_doctor_route" };
  }

  if (role && role !== "admin" && isRouteMatch(pathname, OWNER_ONLY_ROUTES)) {
    return { destination: home, reason: "non_owner_restricted" };
  }

  if (role === "doctor" && pathname === "/clinic-docs") {
    return { destination: "/doctor", reason: "doctor_clinic_docs" };
  }

  if (needsAuth && role && !isStaffRole(role)) {
    return { destination: home, reason: "non_staff_auth" };
  }

  return null;
}

/** Post-onboarding or post-sign-in destination. */
export function postAuthDestination(profile: ProxyProfile | null): string {
  if (!profile?.tenant_id) return "/onboarding";
  if (profile.role === "doctor") return "/doctor/onboarding";
  return defaultHomeForRole(profile.role, profile.tenant_id);
}
