"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLocalForm } from "@/components/common/hooks/useLocalForm";
import { saveGuestVisit, type PatientIntake } from "@/lib/booking/guestVisit";
import { createPublicTriageSession, type PublicClinic } from "@/lib/booking/publicClinicApi";

export function usePatientIntake(clinic: PublicClinic) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useLocalForm<PatientIntake>({
    fullName: "",
    phone: "",
    email: "",
    chiefComplaint: "",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const session = await createPublicTriageSession(clinic.slug, values);
      saveGuestVisit({
        slug: clinic.slug,
        sessionId: session.session_id,
        guestToken: session.guest_token,
        intake: values,
      });
      router.push(`/book/${clinic.slug}/visit`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Intake failed.");
    } finally {
      setSubmitting(false);
    }
  });

  return { form, submitError, submitting, onSubmit };
}
