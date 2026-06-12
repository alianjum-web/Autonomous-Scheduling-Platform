"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";

import { useGetAppointmentsQuery } from "@/components/appointments/store/appointmentsApi";
import { WeeklyAvailabilitySummary } from "@/components/doctors/molecules/WeeklyAvailabilitySummary";
import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import {
  useGetMyProviderQuery,
  useUpdateMyAvailabilityMutation,
} from "@/components/common/store/staffApi";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { PageShell } from "@/components/common/layout/PageShell";
import { appointmentsOnDate, todayDateKey } from "@/lib/scheduling/appointmentTime";
import { appointmentMatchesProvider } from "@/lib/scheduling/providerMatching";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/toast";

export function DoctorScheduleScreen() {
  const { isDoctor, loading } = useRoleGuard();
  const { session } = useAuthSession();
  const { data: provider, isLoading: providerLoading } = useGetMyProviderQuery(undefined, {
    skip: !isDoctor,
  });
  const { data: appointmentData } = useGetAppointmentsQuery(undefined, { skip: !isDoctor });
  const [updateAvailability, { isLoading: saving }] = useUpdateMyAvailabilityMutation();
  const [draft, setDraft] = useState<{
    start: string;
    end: string;
    slotMinutes: number;
  } | null>(null);

  const today = todayDateKey();
  const todaysAppointments = useMemo(() => {
    const rows = appointmentData?.appointments ?? [];
    const mine = rows.filter((row) => appointmentMatchesProvider(row, provider));
    return appointmentsOnDate(mine, today);
  }, [appointmentData?.appointments, provider, today]);

  if (loading || providerLoading) return <LoadingScreen message="Loading schedule…" />;

  if (!session || !isDoctor) {
    return (
      <AccessGate
        title="Doctor schedule"
        description="Set your availability and slot length here."
        icon={<CalendarDays className="size-8" />}
        imageKey="frontDesk"
        signedIn={Boolean(session)}
      />
    );
  }

  const availability = draft ?? {
    start: provider?.availability_start.slice(0, 5) ?? "09:00",
    end: provider?.availability_end.slice(0, 5) ?? "17:00",
    slotMinutes: provider?.slot_duration_minutes ?? 30,
  };

  const handleSave = async () => {
    try {
      await updateAvailability({
        availability_start: availability.start,
        availability_end: availability.end,
        slot_duration_minutes: availability.slotMinutes,
      }).unwrap();
      setDraft(null);
      showToast({ title: "Availability saved", description: "Patients can book during these hours." });
    } catch {
      showToast({ title: "Could not save availability", variant: "destructive" });
    }
  };

  return (
    <PageShell maxWidth="3xl" className="gap-8 pb-12">
      <PageHeader
        eyebrow="Doctor"
        title="Schedule"
        description="Your bookable hours and today's appointments."
        imageKey="frontDesk"
      />

      <WeeklyAvailabilitySummary provider={provider} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5 text-primary" aria-hidden />
            Edit default hours
          </CardTitle>
          <CardDescription>Changes apply to future patient bookings</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="avail-start">Start time</Label>
            <Input
              id="avail-start"
              type="time"
              value={availability.start}
              onChange={(e) => setDraft({ ...availability, start: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avail-end">End time</Label>
            <Input
              id="avail-end"
              type="time"
              value={availability.end}
              onChange={(e) => setDraft({ ...availability, end: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slot-min">Slot length (minutes)</Label>
            <Input
              id="slot-min"
              type="number"
              min={15}
              max={120}
              step={15}
              value={availability.slotMinutes}
              onChange={(e) =>
                setDraft({ ...availability, slotMinutes: Number(e.target.value) })
              }
            />
          </div>
          <div className="sm:col-span-3">
            <Button disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving…" : "Save availability"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s appointments</CardTitle>
          <CardDescription>
            {todaysAppointments.length} patient{todaysAppointments.length === 1 ? "" : "s"} on your
            calendar today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {todaysAppointments.length === 0 ? (
            <p className="text-muted-foreground">No appointments today.</p>
          ) : (
            todaysAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
              >
                <p className="font-medium">{appointment.patient_name ?? "Unknown"}</p>
                <span className="font-mono text-xs">
                  {new Date(appointment.slot_start).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/appointments">Open full calendar</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
