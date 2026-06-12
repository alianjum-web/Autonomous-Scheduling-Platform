"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clinicBookingUrl } from "@/lib/nav/roleNav";
import { saveGuestVisit, updateGuestVisit, type GuestVisit } from "@/lib/booking/guestVisit";
import { startGuestTriageSession } from "@/lib/booking/publicClinicApi";

export function useGuestVisitBootstrap(clinicSlug: string, existing: GuestVisit | null) {
  const router = useRouter();
  const [startedVisit, setStartedVisit] = useState<GuestVisit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !existing);

  const visit = existing ?? startedVisit;

  useEffect(() => {
    if (existing) return;

    let cancelled = false;
    void startGuestTriageSession(clinicSlug)
      .then((session) => {
        if (cancelled) return;
        const next: GuestVisit = {
          slug: clinicSlug,
          sessionId: session.session_id,
          guestToken: session.guest_token,
          intake: {},
          bookingStep: "triage",
        };
        saveGuestVisit(next);
        setStartedVisit(next);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not start triage.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clinicSlug, existing]);

  const goToDetails = (selectedSlot: string) => {
    updateGuestVisit({ selectedSlot, bookingStep: "details" });
    router.push(clinicBookingUrl(clinicSlug, "details"));
  };

  return { visit, loading, error, goToDetails, setVisit: setStartedVisit };
}
