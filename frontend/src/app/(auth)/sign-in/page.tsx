import { Suspense } from "react";

import { SignInForm } from "@/components/common/auth/SignInForm";
import { LoadingScreen } from "@/components/common/layout/PageShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading sign in…" />}>
      <SignInForm />
    </Suspense>
  );
}
