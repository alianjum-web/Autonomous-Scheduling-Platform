import { clinicBookingUrl } from "@/lib/nav/roleNav";
import Link from "next/link";
import { Calendar, MessageSquare, Shield } from "lucide-react";

import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import type { PublicClinic } from "@/lib/booking/publicClinicApi";

interface ClinicBookingHeroProps {
  clinic: PublicClinic;
}

export function ClinicBookingHero({ clinic }: ClinicBookingHeroProps) {
  return (
    <AuthLayout
      title={clinic.name}
      subtitle={
        clinic.welcome_message ??
        "Book an appointment with AI-guided triage. No workspace account required — your visit is handled securely under this clinic's HIPAA boundary."
      }
    >
      <div className="space-y-4">
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            AI triage understands your symptoms and scheduling needs
          </li>
          <li className="flex gap-3">
            <Calendar className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            Book from live clinic availability
          </li>
          <li className="flex gap-3">
            <Shield className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            Data stays isolated to {clinic.name} — you are not joining staff workspace
          </li>
        </ul>

        <Button asChild className="h-11 w-full text-base shadow-md">
          <Link href={clinicBookingUrl(clinic.slug, "visit")}>Start AI triage</Link>
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Clinic staff?{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            Sign in to workspace
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
