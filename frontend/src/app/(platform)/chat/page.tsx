import { Suspense } from "react";

import { PatientChatScreen } from "@/components/patient-triage/screens/PatientChatScreen";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "AI Triage",
  "Clinic staff AI triage workspace — patients book on your public clinic page without an account.",
);

export default function ChatPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading chat…" />}>
      <PatientChatScreen />
    </Suspense>
  );
}
