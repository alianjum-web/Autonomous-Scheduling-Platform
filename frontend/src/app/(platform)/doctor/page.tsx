import { DoctorDashboardScreen } from "@/components/doctors/screens/DoctorDashboardScreen";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata("Doctor Dashboard", "Your appointments and triage queue.");

export default function DoctorDashboardPage() {
  return <DoctorDashboardScreen />;
}
