import { BookClinicClient } from "@/components/booking/screens/BookClinicClient";

export const dynamic = "force-dynamic";

interface BookVisitPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookVisitPage({ params }: BookVisitPageProps) {
  const { slug } = await params;
  return <BookClinicClient slug={slug} step="visit" />;
}
