import { Suspense } from "react";

import { VerifyEmailForm } from "@/components/common/auth/VerifyEmailForm";
import { LoadingScreen } from "@/components/common/layout/PageShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify email" };

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading…" />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
