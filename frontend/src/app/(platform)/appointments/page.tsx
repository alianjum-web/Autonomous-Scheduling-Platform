import { AppointmentsDashboard } from "@/components/appointments/screens/AppointmentsDashboard";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Appointments",
  "Day and week appointment views with real-time sync and slot locking.",
);

export default function AppointmentsPage() {
  return <AppointmentsDashboard />;
}
