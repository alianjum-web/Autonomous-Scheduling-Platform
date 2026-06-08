import { Suspense } from "react";

import { VerifyEmailScreen } from "@/components/auth/screens/VerifyEmailScreen";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify email" };

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading…" />}>
      <VerifyEmailScreen />
    </Suspense>
  );
}
