/** Typed return shape for Supabase profile fetch helpers. */

import type { User } from "@supabase/supabase-js";

import type { ClinicRole } from "@/types/auth";

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
