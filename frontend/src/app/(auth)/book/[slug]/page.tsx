import { BookClinicClient } from "@/components/booking/screens/BookClinicClient";

export const dynamic = "force-dynamic";

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  return <BookClinicClient slug={slug} step="landing" />;
}
