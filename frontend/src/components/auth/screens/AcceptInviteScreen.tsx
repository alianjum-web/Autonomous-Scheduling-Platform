"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useAcceptInvite } from "@/components/auth/hooks/useAcceptInvite";
import { AcceptInviteForm } from "@/components/auth/molecules/AcceptInviteForm";
import { AuthStatusPanel } from "@/components/auth/molecules/AuthStatusPanel";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const {
    preview,
    previewLoading,
    previewError,
    authLoading,
    submitError,
    accepting,
    onAccept,
    signInHref,
  } = useAcceptInvite(token);

  if (!token) {
    return (
      <AuthStatusPanel
        title="Invalid invite"
        subtitle="This invitation link is missing a token."
        message="Ask your clinic owner to resend the invite."
      />
    );
  }

  if (previewLoading || authLoading) {
    return <LoadingScreen message="Loading invitation…" />;
  }

  if (previewError || !preview) {
    return (
      <AuthStatusPanel
        title="Invite not found"
        subtitle="The link may be invalid or expired."
        message="Contact your clinic administrator for a new invite."
      />
    );
  }

  if (preview.expired) {
    return (
      <AuthStatusPanel
        title="Invite expired"
        subtitle={`Invitation for ${preview.clinic_name}.`}
        message="Ask your clinic owner to send a new staff invite."
      />
    );
  }

  return (
    <AcceptInviteForm
      preview={preview}
      signInHref={signInHref}
      submitError={submitError}
      accepting={accepting}
      onAccept={() => void onAccept()}
    />
  );
}

export function AcceptInviteScreen() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading…" />}>
      <AcceptInviteContent />
    </Suspense>
  );
}
