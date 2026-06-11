"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";

import { useGetAppointmentsQuery } from "@/components/appointments/store/appointmentsApi";
import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { useGetMyProviderQuery } from "@/components/common/store/staffApi";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { PageShell } from "@/components/common/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PatientsScreen() {
  const { isStaff, isDoctor, loading } = useRoleGuard();
  const { session } = useAuthSession();
  const today = new Date().toISOString().slice(0, 10);
  const { data: provider } = useGetMyProviderQuery(undefined, { skip: !isDoctor });
  const { data, isLoading } = useGetAppointmentsQuery(today, { skip: !isStaff });

  const patients = useMemo(() => {
    const rows = data?.appointments ?? [];
    const filtered = isDoctor
      ? rows.filter((a) => a.provider_name === provider?.display_name)
      : rows;
    const map = new Map<string, { name: string; phone: string; lastVisit: string }>();
    for (const appt of filtered) {
      const key = `${appt.patient_name}-${appt.patient_phone}`;
      map.set(key, {
        name: appt.patient_name ?? "Unknown",
        phone: appt.patient_phone ?? "—",
        lastVisit: appt.slot_start,
      });
    }
    return Array.from(map.values());
  }, [data, isDoctor, provider?.display_name]);

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
    <PageShell maxWidth="4xl" className="gap-8 pb-12">
      <PageHeader
        eyebrow={isDoctor ? "Doctor" : "Clinic"}
        title="Patients"
        description={
          isDoctor
            ? "Patients who booked appointments with you."
            : "All patients who booked through your clinic booking page."
        }
        imageKey="frontDesk"
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent patients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : patients.length === 0 ? (
            <p className="text-muted-foreground">No patient bookings yet.</p>
          ) : (
            patients.map((patient) => (
              <div
                key={`${patient.name}-${patient.phone}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
              >
                <div>
                  <p className="font-medium">{patient.name}</p>
                  <p className="text-xs text-muted-foreground">{patient.phone}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Last visit: {new Date(patient.lastVisit).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
