"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
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

type Step = "profile" | "specialty" | "availability";

export function DoctorOnboardingScreen() {
  const router = useRouter();
  const { session, loading } = useAuthSession();
  const { isDoctor } = useRoleGuard();
  const { data: provider, isLoading } = useGetMyProviderQuery(undefined, { skip: !isDoctor });
  const [updateAvailability, { isLoading: saving }] = useUpdateMyAvailabilityMutation();
  const [step, setStep] = useState<Step>("profile");
  const [specialty, setSpecialty] = useState(provider?.specialty ?? "General Practice");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");

  useEffect(() => {
    if (session?.user?.id && isDoctorOnboardingComplete(session.user.id)) {
      router.replace("/doctor");
    }
  }, [router, session?.user?.id]);

  if (loading || isLoading) return <LoadingScreen message="Loading…" />;
  if (!session || !isDoctor) return null;

  const finish = async () => {
    try {
      await updateAvailability({
        availability_start: start,
        availability_end: end,
        slot_duration_minutes: provider?.slot_duration_minutes ?? 30,
        specialty: specialty.trim() || "General Practice",
      }).unwrap();
      markDoctorOnboardingComplete(session.user.id);
      showToast({ title: "Profile complete", description: "Welcome to your doctor dashboard." });
      router.push("/doctor");
      router.refresh();
    } catch {
      showToast({ title: "Could not save availability", variant: "destructive" });
    }
  };

  if (step === "profile") {
    return (
      <AuthLayout title="Complete your profile" subtitle="Step 1 of 3 — doctor setup">
        <p className="text-sm text-muted-foreground">
          Signed in as <strong className="text-foreground">{session.user.email}</strong>
        </p>
        <AuthSubmitButton loading={false} loadingLabel="" onClick={() => setStep("specialty")}>
          Continue
        </AuthSubmitButton>
      </AuthLayout>
    );
  }

  if (step === "specialty") {
    return (
      <AuthLayout title="Specialization" subtitle="Step 2 of 3">
        <div className="space-y-2">
          <Label htmlFor="specialty">Your specialty</Label>
          <Input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
        </div>
        <AuthSubmitButton loading={false} loadingLabel="" onClick={() => setStep("availability")}>
          Continue
        </AuthSubmitButton>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Availability" subtitle="Step 3 of 3 — when you accept appointments">
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
