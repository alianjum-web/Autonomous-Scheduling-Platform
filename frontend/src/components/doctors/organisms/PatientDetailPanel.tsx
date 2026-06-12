"use client";

import { useMemo } from "react";

import { AppointmentStatusTag } from "@/components/appointments/atoms/AppointmentStatusTag";
import type { TriageSessionSummary } from "@/components/common/store/staffApi";
import { useListTriageSessionsQuery } from "@/components/common/store/staffApi";
import type { Appointment } from "@/types/appointments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface PatientGroup {
  key: string;
  name: string;
  phone: string | null;
  appointments: Appointment[];
}

interface PatientDetailPanelProps {
  patient: PatientGroup | null;
}

export function PatientDetailPanel({ patient }: PatientDetailPanelProps) {
  const { data: triageData } = useListTriageSessionsQuery(undefined, {
    skip: !patient,
  });

  const triageBySessionId = useMemo(() => {
    const map = new Map<string, TriageSessionSummary>();
    for (const session of triageData?.sessions ?? []) {
      map.set(session.id, session);
    }
    return map;
  }, [triageData?.sessions]);

  if (!patient) {
    return (
      <div className="hero-glow flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-10 text-center">
        <p className="text-sm text-muted-foreground">Select a patient to view details.</p>
      </div>
    );
  }

  const sortedAppointments = [...patient.appointments].sort(
    (a, b) => new Date(b.slot_start).getTime() - new Date(a.slot_start).getTime(),
  );
  const latestWithTriage = sortedAppointments.find(
    (appointment) => appointment.session_id && triageBySessionId.has(appointment.session_id),
  );
  const triageSession = latestWithTriage?.session_id
    ? triageBySessionId.get(latestWithTriage.session_id)
    : null;

  return (
    <div className="space-y-4">
      <Card className="hero-glow">
        <CardHeader>
          <CardTitle>{patient.name}</CardTitle>
          <CardDescription>Patient information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Phone</span>
            <span>{patient.phone ?? "—"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Total visits</span>
            <span>{patient.appointments.length}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Previous appointments</CardTitle>
          <CardDescription>Booked visits with your clinic</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {sortedAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
            >
              <div>
                <p>{new Date(appointment.slot_start).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {appointment.treatment_type ?? "General visit"}
                </p>
              </div>
              <AppointmentStatusTag status={appointment.status} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI triage results</CardTitle>
          <CardDescription>Latest summary from patient intake chat</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          {triageSession?.ai_summary ? (
            <div className="space-y-3">
              {triageSession.chief_complaint ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Chief complaint
                  </p>
                  <p className="mt-1">{triageSession.chief_complaint}</p>
                </div>
              ) : null}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Summary
                </p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {triageSession.ai_summary}
                </p>
              </div>
              {triageSession.triage_status ? (
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Urgency: {triageSession.triage_status.replace(/_/g, " ")}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No AI triage summary linked to this patient yet. Summaries appear after they complete
              the booking chat.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
