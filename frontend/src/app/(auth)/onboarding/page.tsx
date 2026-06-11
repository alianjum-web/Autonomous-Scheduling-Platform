import { Suspense } from "react";

import { OnboardingScreen } from "@/components/auth/screens/OnboardingScreen";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up workspace" };

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading…" />}>
      <OnboardingScreen />
    </Suspense>
  );
}
