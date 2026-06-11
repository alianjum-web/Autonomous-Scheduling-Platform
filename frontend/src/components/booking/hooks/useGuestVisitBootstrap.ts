"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { saveGuestVisit, updateGuestVisit, type GuestVisit } from "@/lib/booking/guestVisit";
import { startGuestTriageSession, type PublicClinic } from "@/lib/booking/publicClinicApi";

export function useGuestVisitBootstrap(clinic: PublicClinic, existing: GuestVisit | null) {
  const router = useRouter();
  const [visit, setVisit] = useState<GuestVisit | null>(existing);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!existing);

  useEffect(() => {
    if (existing) {
      setVisit(existing);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void startGuestTriageSession(clinic.slug)
      .then((session) => {
        if (cancelled) return;
        const next: GuestVisit = {
          slug: clinic.slug,
          sessionId: session.session_id,
          guestToken: session.guest_token,
          intake: {},
          bookingStep: "triage",
        };
        saveGuestVisit(next);
        setVisit(next);
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
  }, [clinic.slug, existing]);

  const goToDetails = (selectedSlot: string) => {
    updateGuestVisit({ selectedSlot, bookingStep: "details" });
    router.push(`/book/${clinic.slug}/details`);
  };

  return { visit, loading, error, goToDetails, setVisit };
}
