import { AuthBackButton } from "@/components/auth/atoms/AuthBackButton";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";

interface OnboardingStaffGuideProps {
  onBack: () => void;
}

export function OnboardingStaffGuide({ onBack }: OnboardingStaffGuideProps) {
  return (
    <AuthLayout
        title="Staff access"
        subtitle="Doctors are invited by the clinic owner — not self-registered (HIPAA least-privilege)."
      >
        <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-5 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">1.</strong> Your clinic owner sends you an email invite from{" "}
            <strong className="text-foreground">Doctors</strong> in their dashboard.
          </p>
          <p>
            <strong className="text-foreground">2.</strong> Open the link, create your password, and accept as doctor.
          </p>
          <p>
            <strong className="text-foreground">3.</strong> Set availability on <strong className="text-foreground">Schedule</strong> and view patients on your dashboard.
          </p>
      </div>
      <AuthBackButton onClick={onBack} />
    </AuthLayout>
  );
}
