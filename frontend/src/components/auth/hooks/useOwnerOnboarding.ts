"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { useLocalForm } from "@/components/common/hooks/useLocalForm";
import { useCreateStaffInviteMutation } from "@/components/common/store/staffApi";
import {
  createClinic,
  normalizeClinicSlug,
  slugifyClinicName,
} from "@/lib/supabase/onboarding";
import { createClient } from "@/lib/supabase/client";

export type OwnerOnboardingStep =
  | "welcome"
  | "clinic"
  | "clinic-type"
  | "team-size"
  | "invite"
  | "finish";

export interface OwnerClinicFormValues {
  clinicName: string;
  clinicSlug: string;
  clinicType: string;
  doctorCount: string;
  inviteEmail: string;
}

const CLINIC_TYPES = [
  "Primary care",
  "Dental",
  "Specialist",
  "Urgent care",
  "Multi-specialty",
  "Other",
] as const;

export function useOwnerOnboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading, tenantId, clinicRole } = useAuthSession();
  const [step, setStep] = useState<OwnerOnboardingStep>("welcome");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [createStaffInvite] = useCreateStaffInviteMutation();

  const form = useLocalForm<OwnerClinicFormValues>({
    clinicName: "",
    clinicSlug: "",
    clinicType: CLINIC_TYPES[0],
    doctorCount: "1-3",
    inviteEmail: "",
  });

  const clinicName = form.watch("clinicName");

  useEffect(() => {
    const slug = searchParams.get("slug");
    if (searchParams.get("mode") === "join" || slug) {
      const rawSlug = slug ?? "";
      router.replace(`/book/${encodeURIComponent(normalizeClinicSlug(rawSlug) || rawSlug)}`);
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (!loading && !session) {
      router.replace(`/sign-up?next=${encodeURIComponent("/onboarding")}`);
    }
  }, [loading, session, router]);

  useEffect(() => {
    if (tenantId && clinicRole === "admin") {
      router.replace("/front-desk");
    }
    if (tenantId && clinicRole === "doctor") {
      router.replace("/doctor/onboarding");
    }
  }, [tenantId, clinicRole, router]);

  useEffect(() => {
    if (clinicName) {
      form.setValue("clinicSlug", slugifyClinicName(clinicName));
    }
  }, [clinicName, form]);

  const createWorkspace = async () => {
    const values = form.getValues();
    const id = await createClinic({
      clinicName: values.clinicName,
      clinicSlug: values.clinicSlug,
    });
    setTenantSlug(values.clinicSlug);
    await createClient().auth.refreshSession();
    return id;
  };

  const nextStep = async () => {
    setSubmitError(null);
    const order: OwnerOnboardingStep[] = [
      "welcome",
      "clinic",
      "clinic-type",
      "team-size",
      "invite",
      "finish",
    ];
    const idx = order.indexOf(step);

    if (step === "clinic") {
      setSubmitting(true);
      try {
        await form.trigger(["clinicName", "clinicSlug"]);
        const { clinicName: name, clinicSlug: slug } = form.getValues();
        if (!name.trim() || !slug.trim()) {
          setSubmitError("Clinic name and booking URL are required.");
          return;
        }
        await createWorkspace();
        setStep("clinic-type");
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Clinic setup failed.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (step === "invite") {
      const email = form.getValues("inviteEmail").trim();
      if (email) {
        setSubmitting(true);
        try {
          await createStaffInvite({ email, role: "doctor" }).unwrap();
        } catch (err) {
          setSubmitError(err instanceof Error ? err.message : "Could not send doctor invite.");
          setSubmitting(false);
          return;
        } finally {
          setSubmitting(false);
        }
      }
    }

    if (step === "finish") {
      router.push("/front-desk");
      router.refresh();
      return;
    }

    if (idx >= 0 && idx < order.length - 1) {
      setStep(order[idx + 1]!);
    }
  };

  const prevStep = () => {
    const order: OwnerOnboardingStep[] = [
      "welcome",
      "clinic",
      "clinic-type",
      "team-size",
      "invite",
      "finish",
    ];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]!);
  };

  return {
    step,
    form,
    submitError,
    submitting,
    loading,
    tenantSlug,
    clinicTypes: CLINIC_TYPES,
    nextStep,
    prevStep,
    setStep,
  };
}
