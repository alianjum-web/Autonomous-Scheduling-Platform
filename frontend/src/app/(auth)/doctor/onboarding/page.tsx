import { DoctorOnboardingScreen } from "@/components/auth/screens/DoctorOnboardingScreen";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata("Doctor setup", "Complete your doctor profile.");

export default function DoctorOnboardingPage() {
  return <DoctorOnboardingScreen />;
}
