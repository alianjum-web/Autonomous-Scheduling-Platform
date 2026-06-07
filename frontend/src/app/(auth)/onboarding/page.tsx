import { OnboardingForm } from "@/components/common/auth/OnboardingForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up workspace" };

export default function OnboardingPage() {
  return <OnboardingForm />;
}
