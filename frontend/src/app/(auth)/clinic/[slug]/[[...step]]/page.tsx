import { notFound, redirect } from "next/navigation";

import { BookClinicClient } from "@/components/booking/screens/BookClinicClient";
import { clinicBookingUrl } from "@/lib/nav/roleNav";

export const dynamic = "force-dynamic";

type BookStep = "landing" | "visit" | "details" | "confirmed";

interface ClinicBookingPageProps {
  params: Promise<{ slug: string; step?: string[] }>;
  searchParams: Promise<{ code?: string }>;
}

function resolveStep(segment: string | undefined): BookStep | "intake" {
  if (!segment) return "landing";
  if (segment === "intake") return "intake";
  if (segment === "visit" || segment === "details" || segment === "confirmed") {
    return segment;
  }
  return "landing";
}

/** Public patient booking — canonical URLs under /clinic/{slug}/… */
export default async function ClinicBookingPage({ params, searchParams }: ClinicBookingPageProps) {
  const { slug, step: stepParts } = await params;
  const segment = stepParts?.[0];
  if (stepParts && stepParts.length > 1) {
    notFound();
  }
  if (
    segment &&
    segment !== "visit" &&
    segment !== "details" &&
    segment !== "confirmed" &&
    segment !== "intake"
  ) {
    notFound();
  }

  const resolved = resolveStep(segment);

  if (resolved === "intake") {
    redirect(clinicBookingUrl(slug, "visit"));
  }

  if (resolved === "confirmed") {
    const { code } = await searchParams;
    return <BookClinicClient slug={slug} step="confirmed" confirmationCode={code} />;
  }

  return <BookClinicClient slug={slug} step={resolved} />;
}
