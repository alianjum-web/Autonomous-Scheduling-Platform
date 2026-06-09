/** Settings / profile UI types. */

import type { ClinicRole } from "@/types/auth";

export interface UserProfileSummary {
  clinicName: string | null;
  workspaceSlug: string | null;
  email: string | null;
  fullName: string | null;
  role: ClinicRole | string | null;
}
