import Link from "next/link";
import { BookOpen, CalendarCheck, MessageSquare, Shield, Upload, Users } from "lucide-react";

import { GuideCard } from "@/components/common/molecules/GuideCard";
import { PageShell } from "@/components/common/layout/PageShell";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { SectionHeading } from "@/components/common/molecules/SectionHeading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ImageAssetKey } from "@/lib/constants/images";

const GUIDES: {
  icon: typeof MessageSquare;
  title: string;
  description: string;
  href: string;
  cta: string;
  imageKey: ImageAssetKey;
}[] = [
  {
    icon: MessageSquare,
    title: "Patient intake chat",
    description:
      "Sign in, open Patient Chat, and start a session. Describe symptoms or scheduling needs — the AI uses your clinic knowledge base and live slot availability.",
    href: "/chat",
    cta: "Open chat",
    imageKey: "chat",
  },
  {
    icon: Upload,
    title: "Clinic documents (staff)",
    description:
      "Admins upload protocols, pricing, insurance policies, and FAQs. Documents are chunked, embedded, and retrieved during patient conversations.",
    href: "/clinic-docs",
    cta: "Manage docs",
    imageKey: "docs",
  },
  {
    icon: CalendarCheck,
    title: "Scheduling",
    description:
      "Patients book through chat; staff view day/week calendars with Redis-backed slot locks that prevent double-booking.",
    href: "/appointments",
    cta: "View calendar",
    imageKey: "appointments",
  },
  {
    icon: Users,
    title: "Front desk escalations",
    description:
      "Emergencies and human handoffs appear in real time on the Front Desk workspace via Supabase Realtime.",
    href: "/front-desk",
    cta: "Open workspace",
    imageKey: "frontDesk",
  },
];

const FAQ = [
  {
    q: "Who can access staff dashboards?",
    a: "Users with clinic_admin or admin role in Supabase app metadata. Set this during onboarding or via your Supabase dashboard.",
  },
  {
    q: "Is patient data sent to the browser LLM?",
    a: "No. All AI processing runs server-side through FastAPI. API keys never reach the client.",
  },
  {
    q: "What happens during a medical emergency in chat?",
    a: "Emergency keywords trigger a deterministic override — the AI stops and displays urgent care guidance while staff are notified.",
  },
  {
    q: "How do I check if services are running?",
    a: "Visit the System Status page for live health checks against the API, database, Redis, and OpenAI.",
  },
] as const;

export function HelpScreen() {
  return (
    <PageShell maxWidth="6xl" className="gap-12 pb-20">
      <PageHeader
        eyebrow="Support"
        title="Help Center"
        description="Quick guides for patients and clinic staff using the Autonomous Scheduling Platform."
        imageKey="team"
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/status">System status</Link>
          </Button>
        }
      />

      <section className="space-y-6">
        <SectionHeading description="Step-by-step guides for the core modules in your clinic workspace.">
          Product guides
        </SectionHeading>
        <div className="grid gap-6 sm:grid-cols-2">
          {GUIDES.map((guide) => (
            <GuideCard key={guide.href} {...guide} />
          ))}
        </div>
      </section>

      <section className="content-divider space-y-6">
        <SectionHeading icon={BookOpen}>Frequently asked questions</SectionHeading>
        <div className="mx-auto grid max-w-3xl gap-4">
          {FAQ.map(({ q, a }) => (
            <Card key={q} className="transition-colors hover:border-primary/25">
              <CardContent className="space-y-2 p-6">
                <h3 className="font-semibold leading-snug">{q}</h3>
                <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">{a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="hero-glow overflow-hidden border-primary/25 bg-linear-to-br from-primary/5 via-card to-accent/20">
        <CardContent className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="size-5 text-primary" aria-hidden />
            </span>
            <div className="space-y-1">
              <p className="font-semibold">Compliance & privacy</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Review our HIPAA notice, privacy policy, and terms before processing patient data.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 rounded-full">
            <Link href="/hipaa-notice">HIPAA notice</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
