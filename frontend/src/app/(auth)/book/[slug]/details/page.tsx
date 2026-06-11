import { BookClinicClient } from "@/components/booking/screens/BookClinicClient";

export const dynamic = "force-dynamic";

interface BookDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookDetailsPage({ params }: BookDetailsPageProps) {
  const { slug } = await params;
  return <BookClinicClient slug={slug} step="details" />;
}
