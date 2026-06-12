"use client";

import Link from "next/link";
import { Suspense } from "react";

import { clinicBookingUrl } from "@/lib/nav/roleNav";

import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { useGuestVisitBootstrap } from "@/components/booking/hooks/useGuestVisitBootstrap";
import { usePublicClinic } from "@/components/booking/hooks/usePublicClinic";
import { ClinicBookingLanding } from "@/components/booking/screens/ClinicBookingLanding";
import { PatientDetailsScreen } from "@/components/booking/screens/PatientDetailsScreen";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { LiveChatPanel } from "@/components/patient-triage/organisms/LiveChatPanel";
import { loadGuestVisit } from "@/lib/booking/guestVisit";

type BookStep = "landing" | "visit" | "details" | "confirmed";

interface BookClinicClientProps {
  slug: string;
  step: BookStep;
  confirmationCode?: string;
}

function PublicVisitPanel({ slug }: { slug: string }) {
  const { clinic, loading, error } = usePublicClinic(slug);
  const existing = loadGuestVisit(slug);
  const { visit, loading: bootLoading, error: bootError, goToDetails } = useGuestVisitBootstrap(
    slug,
    existing,
  );

  if (loading || !clinic) return <LoadingScreen message="Loading clinic…" />;
  if (error) {
    return (
      <AuthLayout title="Clinic not found" subtitle="This booking page is not available.">
        <AuthErrorBanner message={error} />
      </AuthLayout>
    );
  }
  if (bootLoading || !visit) return <LoadingScreen message="Starting AI triage…" />;
  if (bootError) {
    return (
      <AuthLayout title="Could not start visit" subtitle={clinic.name}>
        <AuthErrorBanner message={bootError} />
      </AuthLayout>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-8">
      <LiveChatPanel
        publicVisit={visit}
        autoStartPublicVisit
        onPublicSlotSelected={goToDetails}
      />
    </div>
  );
}

function BookClinicContent({ slug, step, confirmationCode }: BookClinicClientProps) {
  const { clinic, loading, error } = usePublicClinic(slug);

  if (loading) return <LoadingScreen message="Loading clinic…" />;

  if (error || !clinic) {
    const apiMessage = error ?? "This booking page is not available.";
    const isNetworkError =
      apiMessage.includes("Failed to fetch") || apiMessage.includes("NetworkError");
    return (
      <AuthLayout title="Clinic not found" subtitle="This booking page is not available.">
        <AuthErrorBanner
          message={
            isNetworkError
              ? "Cannot reach the API. Start the backend (port 8000) and check NEXT_PUBLIC_API_URL in frontend/.env."
              : apiMessage
          }
        />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Clinic owner?{" "}
          <Link href="/sign-up" className="text-primary hover:underline">
            Sign up
          </Link>{" "}
          to create your clinic and get a public URL like{" "}
          <span className="font-mono">/clinic/your-clinic-slug</span>.
        </p>
      </AuthLayout>
    );
  }

  if (step === "landing") return <ClinicBookingLanding clinic={clinic} />;

  if (step === "visit") return <PublicVisitPanel slug={slug} />;

  if (step === "details") return <PatientDetailsScreen clinic={clinic} />;

  return (
    <AuthLayout
      title="Appointment confirmed"
      subtitle={`Thank you for booking with ${clinic.name}.`}
    >
      <div className="space-y-4 text-center">
        {confirmationCode ? (
          <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 font-mono text-sm">
            Confirmation: {confirmationCode}
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          No account required — you will receive details from the clinic.
        </p>
        <Link href={clinicBookingUrl(slug)} className="text-sm text-primary hover:underline">
          Book another visit
        </Link>
      </div>
    </AuthLayout>
  );
}

export function BookClinicClient({ slug, step, confirmationCode }: BookClinicClientProps) {
  return (
    <Suspense fallback={<LoadingScreen message="Loading…" />}>
      <BookClinicContent slug={slug} step={step} confirmationCode={confirmationCode} />
    </Suspense>
  );
}
