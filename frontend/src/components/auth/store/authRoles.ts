import type { ClinicRole } from "@/types/auth";

export const STAFF_ROLES = new Set<ClinicRole>(["admin", "clinic_admin", "doctor"]);
export const OWNER_ROLES = new Set<ClinicRole>(["admin"]);
/** Clinic owners and front-desk admins — can publish booking page, not billing/doctors. */
export const CLINIC_MANAGER_ROLES = new Set<ClinicRole>(["admin", "clinic_admin"]);
export const DOCTOR_ROLES = new Set<ClinicRole>(["doctor"]);
