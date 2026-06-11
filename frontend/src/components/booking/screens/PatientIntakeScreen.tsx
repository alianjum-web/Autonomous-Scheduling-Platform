"use client";

import { usePatientIntake } from "@/components/booking/hooks/usePatientIntake";
import { PatientIntakeForm } from "@/components/booking/molecules/PatientIntakeForm";
import type { PublicClinic } from "@/lib/booking/publicClinicApi";

interface PatientIntakeScreenProps {
  clinic: PublicClinic;
}

export function PatientIntakeScreen({ clinic }: PatientIntakeScreenProps) {
  const { form, submitError, submitting, onSubmit } = usePatientIntake(clinic);

  return (
    <PatientIntakeForm
      clinic={clinic}
      form={form}
      submitError={submitError}
      submitting={submitting}
      onSubmit={onSubmit}
    />
  );
}
