import { Suspense } from "react";

import { SignInScreen } from "@/components/auth/screens/SignInScreen";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading sign in…" />}>
      <SignInScreen />
    </Suspense>
  );
}
