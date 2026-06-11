"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { useLocalForm } from "@/components/common/hooks/useLocalForm";
import {
  createClinic,
  normalizeClinicSlug,
  slugifyClinicName,
} from "@/lib/supabase/onboarding";

export type OnboardingMode = "choose" | "create" | "staff";

function modeFromSearchParams(searchParams: { get(key: string): string | null }): OnboardingMode {
  if (searchParams.get("mode") === "create") return "create";
  return "choose";
}

export interface CreateClinicFormValues {
  clinicName: string;
  clinicSlug: string;
}

export function useOnboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading, tenantId } = useAuthSession();
  const [userMode, setUserMode] = useState<OnboardingMode | null>(null);
  const mode = userMode ?? modeFromSearchParams(searchParams);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const createForm = useLocalForm<CreateClinicFormValues>({
    clinicName: "",
    clinicSlug: "",
  });

  const clinicName = createForm.watch("clinicName");

  useEffect(() => {
    const slug = searchParams.get("slug");
    if (searchParams.get("mode") === "join" || slug) {
      const rawSlug = slug ?? "";
      router.replace(`/book/${encodeURIComponent(normalizeClinicSlug(rawSlug) || rawSlug)}`);
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (!loading && !session) {
      const query = searchParams.toString();
      const next = query ? `/onboarding?${query}` : "/onboarding";
      router.replace(`/sign-in?next=${encodeURIComponent(next)}`);
    }
  }, [loading, session, router, searchParams]);

  useEffect(() => {
    if (tenantId) {
      router.replace("/front-desk");
    }
  }, [tenantId, router]);

  useEffect(() => {
    if (clinicName) {
      createForm.setValue("clinicSlug", slugifyClinicName(clinicName));
    }
  }, [clinicName, createForm]);

  const onCreateSubmit = createForm.handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await createClinic({
        clinicName: values.clinicName,
        clinicSlug: values.clinicSlug,
      });
      router.push("/front-desk");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Clinic setup failed.");
    } finally {
      setSubmitting(false);
    }
  });

  const goBack = () => {
    setSubmitError(null);
    setUserMode("choose");
  };

  return {
    mode,
    setUserMode,
    loading,
    tenantId,
    createForm,
    submitError,
    submitting,
    onCreateSubmit,
    goBack,
  };
}
