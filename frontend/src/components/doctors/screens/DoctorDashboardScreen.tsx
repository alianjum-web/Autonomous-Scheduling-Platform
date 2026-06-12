"use client";

import { Bot, CalendarDays, ClipboardList, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { isDoctorOnboardingComplete } from "@/components/auth/hooks/useAcceptInvite";
import { DoctorTriageQueuePanel } from "@/components/doctors/molecules/DoctorTriageQueuePanel";
import { StatCard } from "@/components/common/atoms/StatCard";
import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import {
  useGetDoctorDashboardQuery,
  useGetMyProviderQuery,
} from "@/components/common/store/staffApi";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { PageShell } from "@/components/common/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DoctorDashboardScreen() {
  const router = useRouter();
  const { isDoctor, loading } = useRoleGuard();
  const { session } = useAuthSession();
  const { data: provider } = useGetMyProviderQuery(undefined, { skip: !isDoctor });
  const { data: stats, isLoading: statsLoading } = useGetDoctorDashboardQuery(undefined, {
    skip: !isDoctor,
  });

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
        description="Sign in with your invited doctor account to access schedules and patient intake."
        icon={<ClipboardList className="size-8" />}
        imageKey="frontDesk"
        signedIn={Boolean(session)}
      />
    );
  }

  const upcomingCount = stats?.upcoming_patients.length ?? 0;
  const todayKey = new Date().toISOString().slice(0, 10);
  const todaysPatients =
    stats?.upcoming_patients.filter((patient) =>
      patient.slot_start?.startsWith(todayKey),
    ) ?? [];

  return (
    <PageShell maxWidth="5xl" className="gap-8 pb-12">
      <PageHeader
        eyebrow="Doctor"
        title={`Welcome, ${provider?.display_name ?? "Doctor"}`}
        description={
          provider?.specialty
            ? `${provider.specialty} · Review today's patients and AI summaries before each visit.`
            : "Review today's patients and AI summaries before each visit."
        }
        imageKey="frontDesk"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's appointments"
          value={statsLoading ? "…" : String(stats?.appointments_today ?? 0)}
          icon={CalendarDays}
        />
        <StatCard
          label="Upcoming patients"
          value={statsLoading ? "…" : String(upcomingCount)}
          icon={Users}
        />
        <StatCard
          label="Completed intakes"
          value={statsLoading ? "…" : String(stats?.recent_intake_forms ?? 0)}
          icon={ClipboardList}
        />
        <StatCard
          label="AI triage queue"
          value={statsLoading ? "…" : String(stats?.pending_reviews ?? 0)}
          icon={Bot}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s schedule</CardTitle>
            <CardDescription>Upcoming patients — open an appointment for the AI summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {statsLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : todaysPatients.length === 0 ? (
              <p className="text-muted-foreground">No appointments scheduled for today.</p>
            ) : (
              todaysPatients.map((patient) => (
                <div
                  key={`${patient.name}-${patient.slot_start}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-xs text-muted-foreground">{patient.phone ?? "No phone"}</p>
                  </div>
                  {patient.slot_start ? (
                    <span className="font-mono text-xs">
                      {new Date(patient.slot_start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : null}
                </div>
              ))
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/appointments">All appointments</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/patients">Patients</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <DoctorTriageQueuePanel />
      </div>
    </PageShell>
  );
}
