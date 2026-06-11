import { redirect } from "next/navigation";

interface JoinClinicPageProps {
  params: Promise<{ slug: string }>;
}

/** Legacy invite URLs — patients use public booking, not workspace join. */
export default async function JoinClinicPage({ params }: JoinClinicPageProps) {
  const { slug } = await params;
  redirect(`/book/${encodeURIComponent(slug)}`);
}
