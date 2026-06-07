"use client";

import { CheckCircle2, Printer, XCircle } from "lucide-react";

import { AppointmentStatusTag } from "@/components/appointments/atoms/AppointmentStatusTag";
import { Button } from "@/components/ui/button";
import {
  useCancelAppointmentMutation,
  useUpdateAppointmentStatusMutation,
} from "@/components/appointments/store/appointmentsApi";
import type { Appointment, AppointmentStatus } from "@/components/appointments/store/appointmentsSlice";

interface AppointmentDetailPanelProps {
  appointment: Appointment | null;
  onClose?: () => void;
}

export function AppointmentDetailPanel({ appointment, onClose }: AppointmentDetailPanelProps) {
  const [cancelAppointment, { isLoading: cancelling }] = useCancelAppointmentMutation();
  const [updateStatus, { isLoading: updating }] = useUpdateAppointmentStatusMutation();

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
