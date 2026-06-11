import { PatientsScreen } from "@/components/common/screens/PatientsScreen";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata("Patients", "Patients who booked through your clinic.");

export default function PatientsPage() {
  return <PatientsScreen />;
}
