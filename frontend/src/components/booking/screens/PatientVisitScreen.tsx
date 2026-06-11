"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { PageHeader } from "@/components/common/molecules/PageHeader";
import { LiveChatPanel } from "@/components/patient-triage/organisms/LiveChatPanel";
import { Button } from "@/components/ui/button";
import { loadGuestVisit } from "@/lib/booking/guestVisit";
import type { PublicClinic } from "@/lib/booking/publicClinicApi";

interface PatientVisitScreenProps {
  clinic: PublicClinic;
}

export function PatientVisitScreen({ clinic }: PatientVisitScreenProps) {
  const router = useRouter();
  const visit = loadGuestVisit(clinic.slug);

  useEffect(() => {
    if (!visit) {
      router.replace(`/book/${clinic.slug}/intake`);
    }
  }, [clinic.slug, router, visit]);

  if (!visit) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <PageHeader
        eyebrow={clinic.name}
        title="AI triage & booking"
        description={`Hi ${visit.intake.fullName?.split(" ")[0] ?? "there"} — pick a time or add details. ${clinic.name} receives your request.`}
        imageKey="chat"
      />
      <LiveChatPanel publicVisit={visit} autoStartPublicVisit />
      <p className="text-center text-xs text-muted-foreground">
        <Button variant="link" className="h-auto p-0 text-xs" asChild>
          <Link href={`/book/${clinic.slug}`}>← Back to clinic page</Link>
        </Button>
      </p>
    </div>
  );
}
