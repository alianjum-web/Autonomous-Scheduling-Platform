/** Auth / JWT claim types shared across slices and hooks. */

export type ClinicRole = "patient" | "clinic_admin" | "admin" | "doctor";

/** Role labels shown in UI. */
export const ROLE_LABELS: Record<ClinicRole, string> = {
  patient: "Patient",
  clinic_admin: "Staff",
  admin: "Clinic owner",
  doctor: "Doctor",
};

export interface AppMetadataClaims {
  role?: ClinicRole;
  tenant_id?: string;
}

export interface AppJwtPayload {
  sub?: string;
  tenant_id?: string;
  clinic_role?: ClinicRole;
  app_metadata?: AppMetadataClaims;
  exp?: number;
  iat?: number;
}

export function isClinicRole(value: string | null | undefined): value is ClinicRole {
  return value === "patient" || value === "admin" || value === "clinic_admin" || value === "doctor";
}

export function parseJwtPayload(token: string): AppJwtPayload | null {
  try {
    const raw: unknown = JSON.parse(atob(token.split(".")[1] ?? ""));
    if (typeof raw !== "object" || raw === null) return null;
    return raw as AppJwtPayload;
  } catch {
    return null;
  }
}
