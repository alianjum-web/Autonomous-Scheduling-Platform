import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface BookIntakePageProps {
  params: Promise<{ slug: string }>;
}

/** Legacy route — patients start with AI triage, not intake. */
export default async function BookIntakePage({ params }: BookIntakePageProps) {
  const { slug } = await params;
  redirect(`/book/${slug}/visit`);
}
