import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
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

/** Owner (admin) — pays for software, manages clinic. */
export const OWNER_NAV: NavItem[] = [
  { href: "/front-desk", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

/** Doctor — invited by owner; schedule + patients. */
export const DOCTOR_NAV: NavItem[] = [
  { href: "/doctor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/settings", label: "Profile", icon: Settings },
];

/** Legacy clinic_admin — same as owner minus billing/doctors management. */
export const STAFF_NAV: NavItem[] = [
  { href: "/front-desk", label: "Front Desk", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function navForRole(role: ClinicRole | null): NavItem[] {
  if (role === "admin") return OWNER_NAV;
  if (role === "doctor") return DOCTOR_NAV;
  if (role === "clinic_admin") return STAFF_NAV;
  return [];
}

export function defaultHomeForRole(role: ClinicRole | null): string {
  if (role === "admin" || role === "clinic_admin") return "/front-desk";
  if (role === "doctor") return "/doctor";
  return "/onboarding";
}

export const OWNER_ONLY_ROUTES = ["/doctors", "/billing", "/clinic-docs"];
export const DOCTOR_ONLY_ROUTES = ["/doctor", "/doctor/onboarding", "/schedule"];
export const STAFF_ROUTES = ["/front-desk", "/appointments", "/patients", "/doctor", "/schedule"];
