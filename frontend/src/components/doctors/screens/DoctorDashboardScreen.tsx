"use client";

import { CalendarDays, ClipboardList, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { isDoctorOnboardingComplete } from "@/components/auth/hooks/useAcceptInvite";
import { useGetAppointmentsQuery } from "@/components/appointments/store/appointmentsApi";
import { StatCard } from "@/components/common/atoms/StatCard";
import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { useGetMyProviderQuery } from "@/components/common/store/staffApi";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { PageShell } from "@/components/common/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DoctorDashboardScreen() {
  const router = useRouter();
  const { isDoctor, loading } = useRoleGuard();
  const { session } = useAuthSession();
  const today = new Date().toISOString().slice(0, 10);
  const { data: provider } = useGetMyProviderQuery(undefined, { skip: !isDoctor });
  const { data: apptData, isLoading: apptsLoading } = useGetAppointmentsQuery(today, {
    skip: !isDoctor,
  });

  const myAppointments = (apptData?.appointments ?? []).filter(
    (a) => a.provider_name === provider?.display_name,
  );

  useEffect(() => {
    if (session?.user?.id && isDoctor && !isDoctorOnboardingComplete(session.user.id)) {
      router.replace("/doctor/onboarding");
    }
  }, [isDoctor, router, session?.user?.id]);

  if (loading) return <LoadingScreen message="Loading dashboard…" />;

  if (!session || !isDoctor) {
    return (
      <AccessGate
        title="Doctor workspace"
        description="This dashboard is for invited doctors only."
        icon={<ClipboardList className="size-8" />}
        imageKey="frontDesk"
        signedIn={Boolean(session)}
      />
    );
  }

  return (
    <PageShell maxWidth="4xl" className="gap-8 pb-12">
      <PageHeader
        eyebrow="Doctor"
        title={`Welcome, ${provider?.display_name ?? "Doctor"}`}
        description="View today's appointments, triage summaries, and manage your availability."
        imageKey="frontDesk"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Today's appointments"
          value={apptsLoading ? "…" : String(myAppointments.length)}
          icon={CalendarDays}
        />
        <StatCard label="Specialty" value={provider?.specialty ?? "—"} icon={ClipboardList} />
        <StatCard
          label="Availability"
          value={
            provider
              ? `${provider.availability_start.slice(0, 5)}–${provider.availability_end.slice(0, 5)}`
              : "—"
          }
          icon={Users}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s schedule</CardTitle>
          <CardDescription>Appointments assigned to you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {apptsLoading ? (
            <p className="text-muted-foreground">Loading appointments…</p>
          ) : myAppointments.length === 0 ? (
            <p className="text-muted-foreground">No appointments scheduled for today.</p>
          ) : (
            myAppointments.map((appt) => (
              <div
                key={appt.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
              >
                <div>
                  <p className="font-medium">{appt.patient_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {appt.treatment_type ?? "Consultation"} · {appt.status}
                  </p>
                </div>
                <span className="font-mono text-xs">
                  {new Date(appt.slot_start).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
