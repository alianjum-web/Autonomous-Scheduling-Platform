import { createClient } from "@/lib/supabase/client";
import { refreshAuthSessionOnce, resetSessionRefreshThrottle } from "@/lib/supabase/sessionRefresh";

export interface CreateClinicInput {
  clinicName: string;
  clinicSlug: string;
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

  resetSessionRefreshThrottle();
  await refreshAuthSessionOnce(supabase);
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
