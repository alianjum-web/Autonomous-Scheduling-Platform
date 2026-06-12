"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthSubmitButton } from "@/components/auth/atoms/AuthSubmitButton";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import {
  isDoctorOnboardingComplete,
  markDoctorOnboardingComplete,
} from "@/components/auth/hooks/useAcceptInvite";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import {
  useGetMyProviderQuery,
  useUpdateMyAvailabilityMutation,
} from "@/components/common/store/staffApi";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/toast";

type Step = "profile" | "availability" | "complete";

export function DoctorOnboardingScreen() {
  const router = useRouter();
  const { session, loading } = useAuthSession();
  const { isDoctor } = useRoleGuard();
  const { data: provider, isLoading } = useGetMyProviderQuery(undefined, { skip: !isDoctor });
  const [updateAvailability, { isLoading: saving }] = useUpdateMyAvailabilityMutation();
  const [step, setStep] = useState<Step>("profile");
  const [specialty, setSpecialty] = useState(provider?.specialty ?? "General Practice");
  const [yearsExperience, setYearsExperience] = useState("5");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");

  const displayName =
    provider?.display_name ??
    (session?.user?.user_metadata?.full_name as string | undefined) ??
    "Doctor";

  useEffect(() => {
    if (session?.user?.id && isDoctorOnboardingComplete(session.user.id)) {
      router.replace("/doctor");
    }
  }, [router, session?.user?.id]);

  if (loading || isLoading) return <LoadingScreen message="Loading…" />;
  if (!session || !isDoctor) return null;

  const finish = async () => {
    try {
      const yearsLabel = yearsExperience.trim() ? `${yearsExperience.trim()} years` : "";
      const specialtyLabel = [specialty.trim() || "General Practice", yearsLabel]
        .filter(Boolean)
        .join(" · ");

      await updateAvailability({
        availability_start: start,
        availability_end: end,
        slot_duration_minutes: provider?.slot_duration_minutes ?? 30,
        specialty: specialtyLabel,
      }).unwrap();
      markDoctorOnboardingComplete(session.user.id);
      setStep("complete");
    } catch {
      showToast({ title: "Could not save availability", variant: "destructive" });
    }
  };

  if (step === "profile") {
    return (
      <AuthLayout title={`Welcome, Dr. ${displayName}`} subtitle="Step 1 of 2 — quick profile setup">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="specialty">Specialization</Label>
            <Input
              id="specialty"
              placeholder="e.g. Cardiology, General Practice"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="years">Years of experience</Label>
            <Input
              id="years"
              type="number"
              min={0}
              max={60}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
            />
          </div>
        </div>
        <AuthSubmitButton loading={false} loadingLabel="" onClick={() => setStep("availability")}>
          Continue
        </AuthSubmitButton>
      </AuthLayout>
    );
  }

  if (step === "availability") {
    return (
      <AuthLayout title="Availability" subtitle="Step 2 of 2 — when patients can book you">
        <p className="text-sm text-muted-foreground">
          Default hours for your bookable slots. You can change these anytime under Schedule.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start">Start</Label>
            <Input id="start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end">End</Label>
            <Input id="end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <AuthSubmitButton loading={saving} loadingLabel="Saving…" onClick={() => void finish()}>
          Finish setup
        </AuthSubmitButton>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Setup complete" subtitle="You're ready to see patients">
      <p className="text-sm text-muted-foreground">
        Your profile and availability are saved. Open your dashboard to view today&apos;s appointments
        and AI triage summaries.
      </p>
      <AuthSubmitButton
        loading={false}
        loadingLabel=""
        onClick={() => {
          showToast({ title: "Welcome!", description: "Your doctor dashboard is ready." });
          router.push("/doctor");
          router.refresh();
        }}
      >
        Go to dashboard
      </AuthSubmitButton>
    </AuthLayout>
  );
}
