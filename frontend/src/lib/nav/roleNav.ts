import type { LucideIcon } from "lucide-react";
import {
  Bot,
  CalendarDays,
  Clock,
  CreditCard,
  LayoutDashboard,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";

import type { ClinicRole } from "@/types/auth";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Clinic owner — full clinic management. */
export const OWNER_NAV: NavItem[] = [
  { href: "/front-desk", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/chat", label: "AI Triage", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

/** Invited doctor — keep navigation minimal (5 items). */
export const DOCTOR_NAV: NavItem[] = [
  { href: "/doctor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/schedule", label: "Schedule", icon: Clock },
  { href: "/settings", label: "Profile", icon: Settings },
];

/** Staff (clinic_admin) — front desk without owner-only modules. */
export const STAFF_NAV: NavItem[] = [
  { href: "/front-desk", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/chat", label: "AI Triage", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function navForRole(role: ClinicRole | null): NavItem[] {
  if (role === "admin") return OWNER_NAV;
  if (role === "doctor") return DOCTOR_NAV;
  if (role === "clinic_admin") return STAFF_NAV;
  return [];
}

export function defaultHomeForRole(
  role: ClinicRole | null,
  tenantId?: string | null,
): string {
  if (role === "admin" || role === "clinic_admin") return "/front-desk";
  if (role === "doctor") return "/doctor";
  if (tenantId) return "/settings";
  return "/onboarding";
}

/** Signed-in dashboard destination — never returns `/` (which would reload marketing home). */
export function dashboardHrefForAuth(
  isAuthenticated: boolean,
  clinicRole: ClinicRole | null,
  tenantId: string | null,
): string {
  if (!isAuthenticated) return "/sign-in";
  return defaultHomeForRole(clinicRole, tenantId);
}

export const OWNER_ONLY_ROUTES = ["/doctors", "/billing", "/clinic-docs"];
export const OWNER_ADMIN_ROUTES = ["/chat"];
export const DOCTOR_ONLY_ROUTES = [
  "/doctor",
  "/doctor/onboarding",
  "/doctor/intake",
  "/doctor/triage",
  "/schedule",
];
/** Public patient booking URL — no authentication required. */
export function clinicBookingUrl(slug: string, step?: string): string {
  const base = `/clinic/${encodeURIComponent(slug)}`;
  return step ? `${base}/${step}` : base;
}
