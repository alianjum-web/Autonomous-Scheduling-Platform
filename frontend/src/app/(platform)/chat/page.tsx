import { Suspense } from "react";

import { PatientChatScreen } from "@/components/patient-triage/screens/PatientChatScreen";
import { LoadingScreen } from "@/components/common/layout/PageShell";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Patient Chat",
  "AI-powered patient intake with streaming triage and autonomous appointment booking.",
);

export default function ChatPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading chat…" />}>
      <PatientChatScreen />
    </Suspense>
  );
}
