/** Typed return shape for Supabase profile fetch helpers. */

import type { User } from "@supabase/supabase-js";

import type { ClinicRole } from "@/types/auth";

/** Proxy / routing — minimal columns for access decisions. */
export const PROFILE_ROUTING_SELECT = "tenant_id, role" as const;

/** Client UI — full profile with tenant embed. */
export const PROFILE_CLIENT_SELECT = "tenant_id, full_name, role, tenants(name, slug)" as const;

export interface ProfileRoutingRow {
  tenant_id: string | null;
  role: string | null;
}

export interface ProfileTenantEmbed {
  name: string;
  slug: string;
}

export interface ProfileWithTenant {
  tenant_id: string;
  full_name: string | null;
  role: ClinicRole | string;
  tenants: ProfileTenantEmbed | ProfileTenantEmbed[] | null;
}

export interface UserProfileFetchResult {
  user: User;
  profile: ProfileWithTenant | null;
}
