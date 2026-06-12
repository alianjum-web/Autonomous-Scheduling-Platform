"use client";

import { AppointmentCard } from "@/components/appointments/molecules/AppointmentCard";
import type { Appointment } from "@/types/appointments";

interface UpcomingAppointmentsListProps {
  appointments: Appointment[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  emptyMessage?: string;
}

export function UpcomingAppointmentsList({
  appointments,
  selectedId,
  onSelect,
  emptyMessage = "No upcoming appointments.",
}: UpcomingAppointmentsListProps) {
  if (appointments.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          selected={appointment.id === selectedId}
          onClick={() => onSelect?.(appointment.id)}
        />
      ))}
    </div>
  );
}
