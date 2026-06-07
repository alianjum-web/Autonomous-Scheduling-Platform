import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  FileSearch,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IMAGES } from "@/lib/constants/images";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Home",
  "AI-first patient intake and autonomous scheduling for high-trust medical and dental clinics.",
);

const FEATURES = [
  {
    title: "AI Patient Intake",
    description:
      "Streaming chat triage with emergency keyword detection and warm, clinic-aware responses powered by LangGraph.",
    href: "/chat",
    icon: Bot,
    image: IMAGES.chat,
  },
  {
    title: "Front Desk Workspace",
    description:
      "Real-time escalation queue and live calendar view — staff see urgent cases the moment AI flags them.",
    href: "/front-desk",
    icon: Users,
    image: IMAGES.frontDesk,
  },
  {
    title: "Appointments Dashboard",
    description:
      "Day and week views with distributed Redis slot locks preventing double-booking across sessions.",
    href: "/appointments",
    icon: CalendarCheck,
    image: IMAGES.appointments,
  },
  {
    title: "Clinic Documents RAG",
    description:
      "Upload protocols, pricing, and FAQs — embedded into pgvector for grounded patient answers.",
    href: "/clinic-docs",
    icon: FileSearch,
    image: IMAGES.docs,
  },
] as const;

const TRUST_BADGES = [
  "HIPAA-aware architecture",
  "Row-level security",
  "Zero-PHI logs",
  "Multi-tenant JWT",
] as const;

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="page-gradient relative overflow-hidden border-b border-border/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="size-4" aria-hidden />
              AI-first clinical scheduling
            </div>
            <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Welcome to{" "}
              <span className="text-gradient">Symptra</span> — AI scheduling that
              feels premium
            </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                High-trust medical and dental clinics use our platform for streaming AI triage,
                autonomous booking, and real-time staff handoffs — all tenant-isolated and
                compliance-ready.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 gap-2 px-8 text-base shadow-md">
                <Link href="/chat">
                  Start patient chat
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
                <Link href="/sign-in">Staff sign in</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRUST_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  <ShieldCheck className="size-3.5 text-primary" aria-hidden />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="hero-glow relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60">
              <Image
                src={IMAGES.hero}
                alt="Clinical team providing patient care"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 glass-panel p-4">
                <p className="text-sm font-medium">Live triage session</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  AI assistant booking a follow-up · Slot locked via Redis
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mesh-bg py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Everything your clinic needs</h2>
            <p className="mt-3 text-muted-foreground">
              Four integrated modules — patient-facing intake through staff operations — built on
              Supabase, FastAPI, and LangGraph.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {FEATURES.map(({ title, description, href, icon: Icon, image }) => (
              <Link key={href} href={href} className="group block">
                <Card className="dashboard-card-hover h-full overflow-hidden">
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                      <Icon className="size-5" aria-hidden />
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      {title}
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </CardTitle>
                    <CardDescription className="leading-relaxed">{description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/60 bg-card/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Patient chats",
                body: "Streaming SSE intake collects symptoms, answers from clinic RAG, and surfaces available slots.",
              },
              {
                step: "02",
                title: "AI schedules",
                body: "LangGraph agent books appointments with Redis distributed locks — no double-booking.",
              },
              {
                step: "03",
                title: "Staff escalates",
                body: "Front desk receives real-time alerts for emergencies and human handoffs via Supabase Realtime.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="relative space-y-3 rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
                <span className="text-4xl font-bold text-primary/20">{step}</span>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Card className="hero-glow overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/30">
            <CardContent className="flex flex-col items-center gap-6 p-10 text-center sm:p-14">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Ready to transform patient intake?
              </h2>
              <p className="max-w-lg text-muted-foreground">
                Create an account or sign in with your clinic credentials to access the full
                platform — chat, scheduling, documents, and front-desk tools.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-8 shadow-md">
                  <Link href="/sign-up">Get started free</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8">
                  <Link href="/chat">Try patient chat</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
