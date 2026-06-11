import { DoctorScheduleScreen } from "@/components/doctors/screens/DoctorScheduleScreen";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata("Schedule", "Set your availability and slot length.");

export default function SchedulePage() {
  return <DoctorScheduleScreen />;
}
