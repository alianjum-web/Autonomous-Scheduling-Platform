"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLocalForm } from "@/components/common/hooks/useLocalForm";
import { clearGuestVisit, loadGuestVisit, type PatientIntake } from "@/lib/booking/guestVisit";
import { clinicBookingUrl } from "@/lib/nav/roleNav";
import type { PublicClinic } from "@/lib/booking/publicClinicApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function usePatientDetails(clinic: PublicClinic) {
  const router = useRouter();
  const visit = loadGuestVisit(clinic.slug);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useLocalForm<PatientIntake>({
    fullName: visit?.intake.fullName ?? "",
    phone: visit?.intake.phone ?? "",
    email: visit?.intake.email ?? "",
    chiefComplaint: visit?.intake.chiefComplaint ?? "",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!visit?.selectedSlot || !visit.guestToken) {
      setSubmitError("Select an appointment time before entering your details.");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE}/v1/public/clinics/${encodeURIComponent(clinic.slug)}/book`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${visit.guestToken}`,
          },
          body: JSON.stringify({
            slot_start: visit.selectedSlot,
            patient_name: values.fullName,
            patient_phone: values.phone,
            session_id: visit.sessionId,
          }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(
          payload?.detail ?? "Could not confirm appointment. The slot may have been taken.",
        );
      }

      const result = (await response.json()) as { confirmation_code?: string };
      clearGuestVisit();
      router.push(
        `${clinicBookingUrl(clinic.slug, "confirmed")}?code=${encodeURIComponent(result.confirmation_code ?? "")}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Booking failed.";
      if (message === "Failed to fetch" || message.includes("NetworkError")) {
        setSubmitError(
          "Cannot reach the booking server. Ensure the API is running on port 8000, then try again.",
        );
      } else if (message === "Invalid guest token" || message === "Guest token required") {
        setSubmitError(
          "Your booking session expired. Return to AI triage and start again.",
        );
      } else {
        setSubmitError(message);
      }
    } finally {
      setSubmitting(false);
    }
  });

  return { form, submitError, submitting, onSubmit, visit, selectedSlot: visit?.selectedSlot };
}
