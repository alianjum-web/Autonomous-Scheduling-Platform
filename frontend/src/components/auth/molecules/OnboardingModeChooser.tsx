import Link from "next/link";
import { Shield, Users } from "lucide-react";

import { AuthLayout } from "@/components/auth/layout/AuthLayout";

interface OnboardingModeChooserProps {
  onSelectCreate: () => void;
  onSelectStaff: () => void;
}

export function OnboardingModeChooser({ onSelectCreate, onSelectStaff }: OnboardingModeChooserProps) {
  return (
    <AuthLayout
      title="Clinic workspace setup"
      subtitle="Symptra is a multi-tenant platform. Staff sign in here; patients use your public booking page — no workspace account."
    >
      <div className="grid gap-3">
        <button
          type="button"
          onClick={onSelectCreate}
          className="flex items-start gap-4 rounded-xl border border-border p-5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <Shield className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <span className="font-medium">Clinic owner</span>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Create your clinic workspace, sign the BAA, publish the booking page, and invite staff.
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={onSelectStaff}
          className="flex items-start gap-4 rounded-xl border border-border p-5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <Users className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <span className="font-medium">Clinic staff / doctor</span>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Invited by your owner — doctors manage schedule; front desk uses the dashboard.
            </p>
          </div>
        </button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Patient? Use your clinic&apos;s public link:{" "}
        <Link href="/book/harbor-medical-group" className="text-primary hover:underline">
          /book/your-clinic-slug
        </Link>
      </p>
    </AuthLayout>
  );
}
