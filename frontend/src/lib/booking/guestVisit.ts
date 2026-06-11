export interface PatientIntake {
  fullName: string;
  phone: string;
  email: string;
  chiefComplaint: string;
}

export interface GuestVisit {
  slug: string;
  sessionId: string;
  guestToken: string;
  intake: Partial<PatientIntake>;
  selectedSlot?: string | null;
  bookingStep?: "triage" | "details" | "confirmed";
}

const STORAGE_KEY = "symptra_guest_visit";

export function saveGuestVisit(visit: GuestVisit) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(visit));
}

export function updateGuestVisit(patch: Partial<GuestVisit>) {
  const current = loadGuestVisitAny();
  if (!current) return;
  saveGuestVisit({ ...current, ...patch });
}

export function loadGuestVisit(slug: string): GuestVisit | null {
  const parsed = loadGuestVisitAny();
  if (!parsed || parsed.slug !== slug) return null;
  return parsed;
}

function loadGuestVisitAny(): GuestVisit | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestVisit;
  } catch {
    return null;
  }
}

export function clearGuestVisit() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
