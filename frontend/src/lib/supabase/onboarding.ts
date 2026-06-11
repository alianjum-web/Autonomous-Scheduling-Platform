import { createClient } from "@/lib/supabase/client";
import type { UserProfileFetchResult } from "@/types/supabase-profile";

export interface CreateClinicInput {
  clinicName: string;
  clinicSlug: string;
}

export interface ClinicSearchResult {
  slug: string;
  name: string;
}

export async function createClinic(input: CreateClinicInput): Promise<string> {
  const supabase = createClient();
  const clinicSlug = normalizeClinicSlug(input.clinicSlug);
  const { data, error } = await supabase.rpc("complete_onboarding", {
    p_clinic_name: input.clinicName,
    p_clinic_slug: clinicSlug,
    p_role: "admin",
  });

  if (error) throw formatOnboardingRpcError(error, "Clinic setup");
  if (typeof data !== "string" || !data) {
    throw new Error("Clinic setup failed — no workspace returned.");
  }

  await supabase.auth.refreshSession();
  return data;
}

/** @deprecated Use createClinic or joinClinic instead. */
export async function completeOnboarding(input: CreateClinicInput & { role?: string }): Promise<string> {
  if (input.role === "patient") {
    return joinClinic(input.clinicSlug);
  }
  return createClinic(input);
}

export async function joinClinic(clinicSlug: string): Promise<string> {
  const supabase = createClient();
  const normalized = normalizeClinicSlug(clinicSlug);
  if (!normalized) {
    throw new Error("Enter a clinic workspace URL (e.g. harbor-medical-group).");
  }

  const { data, error } = await supabase.rpc("join_clinic", {
    p_clinic_slug: normalized,
  });

  if (error) throw formatOnboardingRpcError(error, "Join clinic");
  if (typeof data !== "string" || !data) {
    throw new Error("Could not join clinic — no workspace returned.");
  }

  await supabase.auth.refreshSession();
  return data;
}

export async function searchClinics(query: string): Promise<ClinicSearchResult[]> {
  const normalized = normalizeClinicSlug(query);
  const searchQuery = normalized || query.trim();
  if (searchQuery.length < 2) return [];

  try {
    return await runOnboardingRpc("Clinic search", (supabase) =>
      supabase.rpc("search_clinics", { p_query: searchQuery }),
    );
  } catch {
    return [];
  }
}

export function slugifyClinicName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Accepts "harbor-medical-group", "clinic/harbor-medical-group", or "/clinic/harbor-medical-group". */
export function normalizeClinicSlug(raw: string): string {
  let value = raw.trim().toLowerCase();
  value = value.replace(/^https?:\/\/[^/]+\//, "");
  value = value.replace(/^\/+/, "");
  if (value.startsWith("clinic/")) {
    value = value.slice("clinic/".length);
  }
  return slugifyClinicName(value);
}

function formatOnboardingRpcError(error: { message?: string; code?: string }, action: string): Error {
  const message = error.message ?? "Request failed";
  if (
    message.includes("schema cache") ||
    message.includes("Could not find the function") ||
    error.code === "PGRST202"
  ) {
    return new Error(
      `${action} is unavailable — database migration not applied. From the backend folder run: npm run db:push`,
    );
  }
  return new Error(message);
}

async function runOnboardingRpc<T>(
  action: string,
  run: (supabase: ReturnType<typeof createClient>) => PromiseLike<{ data: T | null; error: { message?: string; code?: string } | null }>,
): Promise<T> {
  const supabase = createClient();
  const { data, error } = await run(supabase);
  if (error) throw formatOnboardingRpcError(error, action);
  return data as T;
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
