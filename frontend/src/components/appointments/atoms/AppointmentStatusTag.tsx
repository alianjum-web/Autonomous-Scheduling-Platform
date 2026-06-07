import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/components/appointments/store/appointmentsSlice";

const VARIANT: Record<AppointmentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  cancelled: "destructive",
  no_show: "secondary",
  completed: "secondary",
};

export function AppointmentStatusTag({ status }: { status: AppointmentStatus }) {
  return (
    <Badge variant={VARIANT[status]} className="capitalize">
      {status.replace("_", " ")}
    </Badge>
  );
}
