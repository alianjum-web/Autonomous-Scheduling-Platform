import Link from "next/link";

import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { AuthSubmitButton } from "@/components/auth/atoms/AuthSubmitButton";
import type { StaffInvitePreview } from "@/components/common/store/staffApi";
import { Card, CardContent } from "@/components/ui/card";

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
      ? "Clinic owner"
      : preview.role === "doctor"
        ? "Doctor"
        : "Clinic staff";

  return (
    <AuthLayout
      title="Join clinic"
      subtitle={
        preview.role === "doctor"
          ? "Accept your invitation to set up your doctor account."
          : `Accept your invitation to join ${preview.clinic_name}.`
      }
    >
      <Card className="border-border/70 bg-muted/20">
        <CardContent className="space-y-3 p-5 text-sm">
          <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Clinic</span>
            <span className="font-medium">{preview.clinic_name}</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium">{roleLabel}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{preview.email}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {submitError ? <AuthErrorBanner message={submitError} /> : null}
        <AuthSubmitButton loading={accepting} loadingLabel="Joining clinic…" onClick={() => void onAccept()}>
          Accept &amp; continue
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
