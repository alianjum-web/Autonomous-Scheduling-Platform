"use client";

import { Bot, CalendarDays, ClipboardList, LayoutDashboard, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  appointmentsOnDate,
  isCalendarAppointment,
  localDateKey,
  upcomingAppointments,
} from "@/lib/scheduling/appointmentTime";

import { AppointmentDetailPanel } from "@/components/appointments/organisms/AppointmentDetailPanel";
import { DailyCalendarGrid } from "@/components/appointments/organisms/DailyCalendarGrid";
import { UpcomingAppointmentsList } from "@/components/appointments/molecules/UpcomingAppointmentsList";
import { AppointmentStatusTag } from "@/components/appointments/atoms/AppointmentStatusTag";
import { useGetAppointmentsQuery } from "@/components/appointments/store/appointmentsApi";
import { useAppointmentSync } from "@/components/appointments/hooks/useAppointmentSync";
import { useEscalationWatch } from "@/components/appointments/hooks/useEscalationWatch";
import { StatCard } from "@/components/common/atoms/StatCard";
import { selectIsAuthenticated } from "@/components/auth/store/authSelectors";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { PageShell } from "@/components/common/layout/PageShell";
import { useGetOwnerDashboardQuery } from "@/components/common/store/staffApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppSelector } from "@/components/common/store/hooks";
import { selectEscalations } from "@/components/appointments/store/appointmentsSelectors";

/** Owner/admin clinic dashboard — authenticated clinic users only. */
export function FrontDeskWorkspace() {
  const router = useRouter();
  const { isOwner, clinicRole, isDoctor, loading: authLoading } = useRoleGuard();
  const canAccess = isOwner || clinicRole === "clinic_admin";
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { tenantId } = useAuthSession();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useGetOwnerDashboardQuery(undefined, {
    skip: !canAccess,
  });

  useEscalationWatch(tenantId);
  useAppointmentSync(tenantId);

  const escalations = useAppSelector(selectEscalations);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { data: scheduleData } = useGetAppointmentsQuery(undefined, { skip: !canAccess });

  const scheduleAppointments = scheduleData?.appointments ?? [];
  const scheduleDate = useMemo(() => {
    const active = scheduleAppointments.filter((a) => isCalendarAppointment(a.status));
    if (active.some((a) => localDateKey(a.slot_start) === today)) return today;
    const upcoming = [...active].sort(
      (a, b) => new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime(),
    );
    const next = upcoming.find((a) => localDateKey(a.slot_start) >= today);
    return next ? localDateKey(next.slot_start) : today;
  }, [scheduleAppointments, today]);

  const upcoming = useMemo(
    () => upcomingAppointments(scheduleAppointments, today),
    [scheduleAppointments, today],
  );

  const dayOnSchedule = useMemo(
    () => appointmentsOnDate(scheduleAppointments, scheduleDate),
    [scheduleAppointments, scheduleDate],
  );

  const selectedAppointment = useMemo(
    () => scheduleAppointments.find((a) => a.id === selectedAppointmentId) ?? null,
    [scheduleAppointments, selectedAppointmentId],
  );

  useEffect(() => {
    if (!authLoading && isDoctor) {
      router.replace("/doctor");
    }
  }, [authLoading, isDoctor, router]);

  if (authLoading) return <LoadingScreen message="Loading dashboard…" />;
  if (!authLoading && isDoctor) return <LoadingScreen message="Opening doctor dashboard…" />;
  if (!isAuthenticated) {
    return (
      <AccessGate
        title="Sign in to your clinic"
        description="Dashboard, patients, and settings require an authenticated clinic account."
        icon={<LayoutDashboard className="size-8" />}
        imageKey="frontDesk"
        requireAdmin
      />
    );
  }
  if (!canAccess) {
    return (
      <AccessGate
        title="Clinic dashboard"
        description="Doctors use the Doctor Dashboard. This overview is for clinic owners and admins."
        icon={<LayoutDashboard className="size-8" />}
        imageKey="frontDesk"
        requireAdmin
        signedIn
      />
    );
  }

  return (
    <PageShell maxWidth="7xl" className="flex min-h-[calc(100vh-12rem)] flex-col gap-8 pb-8">
      <PageHeader
        eyebrow="Clinic overview"
        title="Dashboard"
        description="Today's operations, team activity, and AI triage at a glance."
        imageKey="frontDesk"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Upcoming appointments"
          value={statsLoading ? "…" : String(upcoming.length)}
          trend={`${appointmentsOnDate(scheduleAppointments, today).length} on today\u2019s calendar`}
          icon={CalendarDays}
        />
        <StatCard
          label="Pending requests"
          value={statsLoading ? "…" : String(stats?.pending_requests ?? escalations.length)}
          icon={ClipboardList}
        />
        <StatCard
          label="Active doctors"
          value={statsLoading ? "…" : String(stats?.active_doctors ?? 0)}
          icon={Stethoscope}
        />
        <StatCard
          label="AI triage today"
          value={statsLoading ? "…" : String(stats?.triage_sessions_today ?? 0)}
          icon={Bot}
        />
        <StatCard
          label="Total triage sessions"
          value={statsLoading ? "…" : String(stats?.triage_sessions_total ?? 0)}
          icon={Bot}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Next appointments</CardTitle>
            <CardDescription>Confirmed and pending visits — one row per booking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground">No upcoming bookings.</p>
            ) : (
              upcoming.slice(0, 5).map((appointment) => (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => setSelectedAppointmentId(appointment.id)}
                  className="block w-full rounded-lg border border-border/60 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{appointment.patient_name}</p>
                    <AppointmentStatusTag status={appointment.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{appointment.patient_phone ?? "No phone"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(appointment.slot_start).toLocaleString()}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {appointment.confirmation_code}
                  </p>
                </button>
              ))
            )}
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/patients">View all patients</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid min-h-[420px] flex-1 gap-4 lg:col-span-2">
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="hero-glow flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card">
              <div className="border-b border-border/60 bg-destructive/5 px-4 py-3 sm:px-5">
                <h2 className="flex items-center gap-2 font-semibold">
                  Escalation queue
                  {escalations.length > 0 ? (
                    <span className="rounded-full bg-destructive px-2.5 py-0.5 text-xs font-medium text-destructive-foreground">
                      {escalations.length}
                    </span>
                  ) : null}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Patients who requested urgent human help during AI triage
                </p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
                {escalations.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No active escalations — all clear.
                  </p>
                ) : (
                  escalations.map((e) => (
                    <div
                      key={e.id}
                      className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
                    >
                      <p className="font-medium">{e.patient_name || "Unknown patient"}</p>
                      <p className="mt-1 line-clamp-2 text-muted-foreground">
                        {e.ai_summary || "Patient requested human assistance."}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="hero-glow flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card">
              <div className="border-b border-border/60 px-4 py-3 sm:px-5">
                <h2 className="font-semibold">
                  {scheduleDate === today ? "Today\u2019s schedule" : "Upcoming schedule"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {scheduleDate !== today
                    ? `Showing ${new Date(`${scheduleDate}T12:00:00`).toLocaleDateString()}`
                    : "Click a slot to view patient details and AI triage summary"}
                </p>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                <DailyCalendarGrid
                  appointments={scheduleAppointments}
                  date={scheduleDate}
                  selectedId={selectedAppointmentId}
                  onSelect={setSelectedAppointmentId}
                />
                {upcoming.length > dayOnSchedule.length ? (
                  <div className="border-t border-border/60 pt-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      More upcoming bookings
                    </p>
                    <UpcomingAppointmentsList
                      appointments={upcoming}
                      selectedId={selectedAppointmentId}
                      onSelect={setSelectedAppointmentId}
                    />
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <AppointmentDetailPanel
            appointment={selectedAppointment}
            onClose={() => setSelectedAppointmentId(null)}
          />
        </div>
      </div>
    </PageShell>
  );
}
