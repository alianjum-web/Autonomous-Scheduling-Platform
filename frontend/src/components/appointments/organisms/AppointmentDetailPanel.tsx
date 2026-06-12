"use client";

import { useMemo } from "react";
import { CheckCircle2, Printer, XCircle } from "lucide-react";

import { AppointmentStatusTag } from "@/components/appointments/atoms/AppointmentStatusTag";
import { useListTriageSessionsQuery } from "@/components/common/store/staffApi";
import { Button } from "@/components/ui/button";
import {
  useCancelAppointmentMutation,
  useUpdateAppointmentStatusMutation,
} from "@/components/appointments/store/appointmentsApi";
import type { Appointment, AppointmentStatus } from "@/types/appointments";

interface AppointmentDetailPanelProps {
  appointment: Appointment | null;
  onClose?: () => void;
}

export function AppointmentDetailPanel({ appointment, onClose }: AppointmentDetailPanelProps) {
  const [cancelAppointment, { isLoading: cancelling }] = useCancelAppointmentMutation();
  const [updateStatus, { isLoading: updating }] = useUpdateAppointmentStatusMutation();
  const { data: triageData } = useListTriageSessionsQuery(undefined, {
    skip: !appointment?.session_id,
  });

  const triageSession = useMemo(
    () => triageData?.sessions.find((session) => session.id === appointment?.session_id) ?? null,
    [appointment?.session_id, triageData?.sessions],
  );

  if (!appointment) {
    return (
      <div className="hero-glow flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-10 text-center">
        <p className="text-sm text-muted-foreground">Select an appointment to view details.</p>
      </div>
    );
  }

  const handlePrint = () => window.print();

  const setStatus = (status: AppointmentStatus) => {
    void updateStatus({ id: appointment.id, status });
  };

  return (
    <div className="hero-glow rounded-2xl border border-border/80 bg-card p-6 print:border-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{appointment.patient_name}</h3>
        <AppointmentStatusTag status={appointment.status} />
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
          <dt className="text-muted-foreground">Time</dt>
          <dd>{new Date(appointment.slot_start).toLocaleString()}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
          <dt className="text-muted-foreground">Provider</dt>
          <dd>{appointment.provider_name ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
          <dt className="text-muted-foreground">Treatment</dt>
          <dd>{appointment.treatment_type ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
          <dt className="text-muted-foreground">Reason for visit</dt>
          <dd className="text-right">{triageSession?.chief_complaint ?? appointment.treatment_type ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Confirmation</dt>
          <dd className="font-mono">{appointment.confirmation_code}</dd>
        </div>
        {appointment.patient_phone ? (
          <div className="flex justify-between gap-4 pt-2">
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{appointment.patient_phone}</dd>
          </div>
        ) : null}
      </dl>
      {triageSession?.ai_summary ? (
        <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
          <p className="font-medium">AI triage summary</p>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed text-muted-foreground">
            {triageSession.ai_summary}
          </p>
          {triageSession.triage_status ? (
            <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
              Urgency: {triageSession.triage_status.replace(/_/g, " ")}
            </p>
          ) : null}
        </div>
      ) : appointment.session_id ? (
        <div className="mt-4 rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
          AI triage summary will appear here after the patient completes the booking chat.
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-2 print:hidden">
        {appointment.status === "confirmed" ? (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={updating}
              onClick={() => setStatus("completed")}
              className="gap-1.5"
            >
              <CheckCircle2 className="size-4" aria-hidden />
              Completed
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={updating}
              onClick={() => setStatus("no_show")}
              className="gap-1.5"
            >
              <XCircle className="size-4" aria-hidden />
              No-show
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={cancelling}
              onClick={() => cancelAppointment(appointment.id)}
            >
              Cancel
            </Button>
          </>
        ) : null}
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
          <Printer className="size-4" aria-hidden />
          Print
        </Button>
        {onClose ? (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        ) : null}
      </div>
    </div>
  );
}