import type { PatientIntake } from "@/lib/booking/guestVisit";
import { clinicBookingUrl } from "@/lib/nav/roleNav";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface PublicClinic {
  slug: string;
  name: string;
  welcome_message: string | null;
}

export interface PublicTriageSession {
  session_id: string;
  guest_token: string;
  status: string;
}

export async function fetchPublicClinic(slug: string): Promise<PublicClinic> {
  const response = await fetch(`${API_BASE}/v1/public/clinics/${encodeURIComponent(slug)}`);
  const payload = (await response.json().catch(() => null)) as { detail?: string } | PublicClinic | null;
  if (!response.ok) {
    const message =
      payload && "detail" in payload && typeof payload.detail === "string"
        ? payload.detail
        : "Clinic booking page is not available.";
    throw new Error(message);
  }
  return payload as PublicClinic;
}

export async function startGuestTriageSession(
  slug: string,
  chiefComplaint?: string,
): Promise<PublicTriageSession> {
  const response = await fetch(
    `${API_BASE}/v1/public/clinics/${encodeURIComponent(slug)}/triage/session`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chief_complaint: chiefComplaint ?? null }),
    },
  );
  const payload = (await response.json().catch(() => null)) as
    | { detail?: string }
    | PublicTriageSession
    | null;
  if (!response.ok) {
    const message =
      payload && "detail" in payload && typeof payload.detail === "string"
        ? payload.detail
        : "Could not start your visit.";
    throw new Error(message);
  }
  return payload as PublicTriageSession;
}

export async function createPublicTriageSession(
  slug: string,
  intake: PatientIntake,
): Promise<PublicTriageSession> {
  const response = await fetch(
    `${API_BASE}/v1/public/clinics/${encodeURIComponent(slug)}/triage/session/intake`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: intake.fullName,
        phone: intake.phone,
        email: intake.email,
        chief_complaint: intake.chiefComplaint,
      }),
    },
  );
  const payload = (await response.json().catch(() => null)) as { detail?: string } | PublicTriageSession | null;
  if (!response.ok) {
    const message =
      payload && "detail" in payload && typeof payload.detail === "string"
        ? payload.detail
        : "Could not start your visit.";
    throw new Error(message);
  }
  return payload as PublicTriageSession;
}

export function publicBookingUrl(slug: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${clinicBookingUrl(slug)}`;
  }
  return clinicBookingUrl(slug);
}
