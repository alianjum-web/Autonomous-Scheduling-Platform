import Link from "next/link";

import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { AuthSubmitButton } from "@/components/auth/atoms/AuthSubmitButton";
import type { StaffInvitePreview } from "@/components/common/store/staffApi";

interface AcceptInviteFormProps {
  preview: StaffInvitePreview;
  signInHref: string;
  submitError: string | null;
  accepting: boolean;
  onAccept: () => void;
}

export function AcceptInviteForm({
  preview,
  signInHref,
  submitError,
  accepting,
  onAccept,
}: AcceptInviteFormProps) {
  const roleLabel =
    preview.role === "admin"
      ? "clinic owner"
      : preview.role === "doctor"
        ? "doctor"
        : "clinic staff";

  return (
    <AuthLayout
      title={`Join ${preview.clinic_name}`}
      subtitle={
        preview.role === "doctor"
          ? `You are invited as a doctor at ${preview.clinic_name}. Accept to finish setup.`
          : `You are invited as ${roleLabel}. Sign in as ${preview.email} to continue.`
      }
    >
      <div className="space-y-4">
        {submitError ? <AuthErrorBanner message={submitError} /> : null}
        <AuthSubmitButton loading={accepting} loadingLabel="Joining clinic…" onClick={() => void onAccept()}>
          Accept invitation
        </AuthSubmitButton>
        <p className="text-center text-xs text-muted-foreground">
          Wrong account?{" "}
          <Link href={signInHref} className="text-primary hover:underline">
            Sign in with {preview.email}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
