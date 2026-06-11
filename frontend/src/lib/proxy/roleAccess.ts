/**
 * Role + route access rules for the Next.js proxy (middleware).
 * Single source of truth — keep in sync with `lib/nav/roleNav.ts` for client nav.
 */

import type { ClinicRole } from "@/types/auth";
import { isClinicRole } from "@/types/auth";
import {
  defaultHomeForRole,
  DOCTOR_ONLY_ROUTES,
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
  | "patient_to_booking"
  | "non_staff_protected"
  | "doctor_front_desk"
  | "owner_doctor_route"
  | "non_owner_restricted"
  | "doctor_clinic_docs"
  | "non_staff_auth"
  | "doctor_owner_onboarding"
  | "owner_doctor_onboarding";

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
  "/join/",
  "/auth/",
] as const;

export const PUBLIC_ROUTES = [
  "/",
  "/privacy",
  "/terms",
  "/hipaa-notice",
  "/help",
  "/status",
  "/book",
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
] as const;

export type AuthRoute = (typeof AUTH_ROUTES)[number];
export type PublicRoute = (typeof PUBLIC_ROUTES)[number];
export type ProtectedRoute = (typeof PROTECTED_ROUTES)[number];

export function normalizeProfileRole(role: string | null | undefined): ClinicRole | null {
  return isClinicRole(role) ? role : null;
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

/** Default landing path after sign-in / onboarding for a role. */
export function homeForRole(role: ClinicRole | null): string {
  return defaultHomeForRole(role);
}

/**
 * Returns a redirect when the signed-in user's role may not access `pathname`.
 * Returns `null` when the request should proceed.
 */
export function resolveRoleRedirect(
  pathname: string,
  profile: ProxyProfile | null,
  options: { needsAuth: boolean; tenantSlug?: string | null },
): RoleRedirect | null {
  if (!profile) return null;

  const { needsAuth, tenantSlug } = options;
  const { role, tenant_id: tenantId } = profile;
  const home = homeForRole(role);

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

  if (tenantId && role === "patient" && tenantSlug && !pathname.startsWith("/book/")) {
    return { destination: `/book/${tenantSlug}`, reason: "patient_to_booking" };
  }

  if (tenantId && role && !isStaffRole(role) && needsAuth) {
    return { destination: home, reason: "non_staff_protected" };
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
  return homeForRole(profile.role);
}
