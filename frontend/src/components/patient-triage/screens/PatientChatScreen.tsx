"use client";

import { LiveChatPanel } from "@/components/patient-triage/organisms/LiveChatPanel";

export function PatientChatScreen() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <LiveChatPanel />
    </div>
  );
}
