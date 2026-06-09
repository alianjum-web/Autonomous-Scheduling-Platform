import { createClient } from "@/lib/supabase/client";
import type { UserProfileFetchResult } from "@/types/supabase-profile";

export interface OnboardingInput {
  clinicName: string;
  clinicSlug: string;
  role: "patient" | "clinic_admin";
}

export async function completeOnboarding(input: OnboardingInput): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("complete_onboarding", {
    p_clinic_name: input.clinicName,
    p_clinic_slug: input.clinicSlug,
    p_role: input.role,
  });

  if (error) throw new Error(error.message);
  if (typeof data !== "string" || !data) {
    throw new Error("Onboarding failed — no tenant returned.");
  }

  await supabase.auth.refreshSession();
  return data;
}

export function slugifyClinicName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function fetchUserProfile(): Promise<UserProfileFetchResult | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, full_name, role, tenants(name, slug)")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile: profile as UserProfileFetchResult["profile"],
  };
}
