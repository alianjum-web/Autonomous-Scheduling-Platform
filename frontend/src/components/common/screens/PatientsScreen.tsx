"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";

import { useGetAppointmentsQuery } from "@/components/appointments/store/appointmentsApi";
import {
  PatientDetailPanel,
  type PatientGroup,
} from "@/components/doctors/organisms/PatientDetailPanel";
import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { useGetMyProviderQuery } from "@/components/common/store/staffApi";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { PageShell } from "@/components/common/layout/PageShell";
import { isActiveAppointment } from "@/lib/scheduling/appointmentTime";
import { appointmentMatchesProvider } from "@/lib/scheduling/providerMatching";
import type { Appointment } from "@/types/appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function groupPatients(appointments: Appointment[]): PatientGroup[] {
  const map = new Map<string, PatientGroup>();

  for (const appointment of appointments) {
    const name = appointment.patient_name ?? "Unknown";
    const phone = appointment.patient_phone ?? null;
    const key = `${name.toLowerCase()}|${phone ?? ""}`;
    const existing = map.get(key);
    if (existing) {
      existing.appointments.push(appointment);
    } else {
      map.set(key, { key, name, phone, appointments: [appointment] });
    }
  }

  return [...map.values()].sort((a, b) => {
    const latestA = Math.max(...a.appointments.map((row) => new Date(row.slot_start).getTime()));
    const latestB = Math.max(...b.appointments.map((row) => new Date(row.slot_start).getTime()));
    return latestB - latestA;
  });
}

export function PatientsScreen() {
  const { isStaff, isDoctor, loading } = useRoleGuard();
  const { session } = useAuthSession();
  const { data: provider } = useGetMyProviderQuery(undefined, { skip: !isDoctor });
  const { data, isLoading } = useGetAppointmentsQuery(undefined, { skip: !isStaff });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const bookings = useMemo(() => {
    const rows = [...(data?.appointments ?? [])]
      .filter((a) => isActiveAppointment(a.status))
      .sort((a, b) => new Date(b.slot_start).getTime() - new Date(a.slot_start).getTime());
    return isDoctor
      ? rows.filter((a) => appointmentMatchesProvider(a, provider))
      : rows;
  }, [data, isDoctor, provider]);

  const patients = useMemo(() => groupPatients(bookings), [bookings]);
  const selectedPatient = patients.find((patient) => patient.key === selectedKey) ?? null;

  if (loading) return <LoadingScreen message="Loading patients…" />;

  if (!session || !isStaff) {
    return (
      <AccessGate
        title="Patients"
        description="Staff and doctors can view patient intake from booked appointments."
        icon={<Users className="size-8" />}
        imageKey="frontDesk"
        signedIn={Boolean(session)}
      />
    );
  }

  return (
    <PageShell maxWidth="6xl" className="gap-8 pb-12">
      <PageHeader
        eyebrow={isDoctor ? "Doctor" : "Clinic"}
        title="Patients"
        description={
          isDoctor
            ? "Your patients — tap a name to see visit history and AI triage summaries."
            : "All patients who booked through your clinic booking page."
        }
        imageKey="frontDesk"
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{isDoctor ? "Your patients" : "All patients"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {isLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : patients.length === 0 ? (
              <p className="text-muted-foreground">No patient bookings yet.</p>
            ) : (
              patients.map((patient) => {
                    const latest = [...patient.appointments].sort(
                      (a, b) => new Date(b.slot_start).getTime() - new Date(a.slot_start).getTime(),
                    )[0];
                const active = selectedKey === patient.key;
                return (
                  <button
                    key={patient.key}
                    type="button"
                    onClick={() => setSelectedKey(patient.key)}
                    className={cn(
                      "flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                      active
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/60 hover:bg-muted/40",
                    )}
                  >
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">{patient.phone ?? "No phone"}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{patient.appointments.length} visit{patient.appointments.length === 1 ? "" : "s"}</p>
                      {latest ? (
                        <p className="mt-1">{new Date(latest.slot_start).toLocaleDateString()}</p>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <PatientDetailPanel patient={selectedPatient} />
        </div>
      </div>
    </PageShell>
  );
}
