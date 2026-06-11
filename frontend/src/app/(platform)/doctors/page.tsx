import { DoctorsScreen } from "@/components/doctors/screens/DoctorsScreen";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata("Doctors", "Invite and manage clinic doctors.");

export default function DoctorsPage() {
  return <DoctorsScreen />;
}
