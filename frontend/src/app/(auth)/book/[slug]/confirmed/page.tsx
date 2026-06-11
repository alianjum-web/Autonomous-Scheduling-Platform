import { BookClinicClient } from "@/components/booking/screens/BookClinicClient";

export const dynamic = "force-dynamic";

interface BookConfirmedPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ code?: string }>;
}

export default async function BookConfirmedPage({ params, searchParams }: BookConfirmedPageProps) {
  const { slug } = await params;
  const { code } = await searchParams;
  return <BookClinicClient slug={slug} step="confirmed" confirmationCode={code} />;
}
