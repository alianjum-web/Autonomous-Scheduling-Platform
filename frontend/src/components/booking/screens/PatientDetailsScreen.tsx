"use client";

import { usePatientDetails } from "@/components/booking/hooks/usePatientDetails";
import { PatientIntakeForm } from "@/components/booking/molecules/PatientIntakeForm";
import type { PublicClinic } from "@/lib/booking/publicClinicApi";
import Link from "next/link";
import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";

interface PatientDetailsScreenProps {
  clinic: PublicClinic;
}

export function PatientDetailsScreen({ clinic }: PatientDetailsScreenProps) {
  const { form, submitError, submitting, onSubmit, selectedSlot } = usePatientDetails(clinic);

  if (!selectedSlot) {
    return (
      <AuthLayout title="Select a time first" subtitle="Choose a slot during AI triage.">
        <AuthErrorBanner message="Go back to triage and pick an appointment time." />
        <Link href={`/book/${clinic.slug}/visit`} className="mt-4 block text-center text-sm text-primary hover:underline">
          Return to AI triage
        </Link>
      </AuthLayout>
    );
  }

  return (
    <PatientIntakeForm
      clinic={clinic}
      form={form}
      submitError={submitError}
      submitting={submitting}
      onSubmit={onSubmit}
      title="Your details"
      subtitle="Almost done — confirm your contact info to complete the booking."
      submitLabel="Confirm appointment"
      showChiefComplaint={false}
    />
  );
}
