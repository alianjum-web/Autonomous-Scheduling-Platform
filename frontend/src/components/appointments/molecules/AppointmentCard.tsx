import { AppointmentStatusTag } from "@/components/appointments/atoms/AppointmentStatusTag";
import { ProviderAvatar } from "@/components/appointments/atoms/ProviderAvatar";
import type { Appointment } from "@/components/appointments/store/appointmentsSlice";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

interface AppointmentCardProps {
  appointment: Appointment;
  selected?: boolean;
  onClick?: () => void;
}

export function AppointmentCard({ appointment, selected, onClick }: AppointmentCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition-colors ${
        selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <ProviderAvatar name={appointment.provider_name ?? "Provider"} />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">{appointment.patient_name}</p>
            <AppointmentStatusTag status={appointment.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatTime(appointment.slot_start)} · {appointment.treatment_type ?? "consultation"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {appointment.provider_name} · {appointment.confirmation_code}
          </p>
        </div>
      </div>
    </button>
  );
}
