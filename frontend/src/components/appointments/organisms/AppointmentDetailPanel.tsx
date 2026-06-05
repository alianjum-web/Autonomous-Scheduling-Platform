"use client";

import { Printer } from "lucide-react";

import { AppointmentStatusTag } from "@/components/appointments/atoms/AppointmentStatusTag";
import { Button } from "@/components/ui/button";
import { useCancelAppointmentMutation } from "@/store/api";
import type { Appointment } from "@/store/appointmentsSlice";

interface AppointmentDetailPanelProps {
  appointment: Appointment | null;
  onClose?: () => void;
}

export function AppointmentDetailPanel({ appointment, onClose }: AppointmentDetailPanelProps) {
  const [cancelAppointment, { isLoading }] = useCancelAppointmentMutation();

  if (!appointment) {
    return (
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        Select an appointment to view details.
      </div>
    );
  }

  const handlePrint = () => window.print();

  return (
    <div className="rounded-lg border p-6 print:border-0">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{appointment.patient_name}</h3>
        <AppointmentStatusTag status={appointment.status} />
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Time</dt>
          <dd>{new Date(appointment.slot_start).toLocaleString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Provider</dt>
          <dd>{appointment.provider_name ?? "—"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Treatment</dt>
          <dd>{appointment.treatment_type ?? "—"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Confirmation</dt>
          <dd className="font-mono">{appointment.confirmation_code}</dd>
        </div>
        {appointment.patient_phone ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{appointment.patient_phone}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-6 flex gap-2 print:hidden">
        {appointment.status === "confirmed" ? (
          <Button
            variant="destructive"
            size="sm"
            disabled={isLoading}
            onClick={() => cancelAppointment(appointment.id)}
          >
            Cancel
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Summary
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
