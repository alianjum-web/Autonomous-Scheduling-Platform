import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  MessageSquare,
  Shield,
  Upload,
  Users,
} from "lucide-react";

import { ClinicalImage } from "@/components/common/atoms/ClinicalImage";
import { PageShell } from "@/components/common/layout/PageShell";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <PageShell maxWidth="4xl" className="gap-10 pb-16">
      <PageHeader
        eyebrow="Support"
        title="Help Center"
        description="Quick guides for patients and clinic staff using the Autonomous Scheduling Platform."
        imageKey="team"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/status">System status</Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2">
        {GUIDES.map(({ icon: Icon, title, description, href, cta, imageKey }) => (
          <Card key={href} className="hero-glow flex flex-col overflow-hidden">
            <div className="relative h-28">
              <ClinicalImage asset={imageKey} variant="thumb" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className="size-5 text-primary" aria-hidden />
                {title}
              </CardTitle>
              <CardDescription className="leading-relaxed">{description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-0">
              <Button asChild variant="link" className="h-auto gap-1 p-0">
                <Link href={href}>
                  {cta}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <BookOpen className="size-5 text-primary" aria-hidden />
          Frequently asked questions
        </h2>
        <div className="grid gap-3">
          {FAQ.map(({ q, a }) => (
            <Card key={q}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="font-medium">Compliance & privacy</p>
              <p className="text-sm text-muted-foreground">
                Review our HIPAA notice, privacy policy, and terms before processing patient data.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/hipaa-notice">HIPAA notice</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
