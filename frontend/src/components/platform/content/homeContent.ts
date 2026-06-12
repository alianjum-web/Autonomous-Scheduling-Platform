import type { LucideIcon } from "lucide-react";
import { Bot, CalendarCheck, FileSearch, Users } from "lucide-react";

import type { ImageAssetKey } from "@/lib/constants/images";

export type HomeFeature = {
  title: string;
  description: string;
  icon: LucideIcon;
  imageKey: ImageAssetKey;
};

export type HowItWorksStepData = {
  step: string;
  title: string;
  body: string;
  imageKey: ImageAssetKey;
};

export const HOME_FEATURES: HomeFeature[] = [
  {
    title: "Owner dashboard",
    description:
      "Overview of today's appointments, active doctors, pending requests, and AI triage statistics — one clinic command center.",
    icon: Users,
    imageKey: "frontDesk",
  },
  {
    title: "Doctor workspace",
    description:
      "Invited doctors get schedule, patients, intake forms, and triage results — no self-signup required.",
    icon: Bot,
    imageKey: "chat",
  },
  {
    title: "Patient booking (no login)",
    description:
      "Public clinic pages with AI triage, slot selection, intake form, and confirmation — zero account friction.",
    icon: CalendarCheck,
    imageKey: "appointments",
  },
  {
    title: "HIPAA-aware multi-tenant",
    description:
      "Tenant-isolated data, row-level security, and BAA gating — built for sellable clinic SaaS.",
    icon: FileSearch,
    imageKey: "docs",
  },
];

export const HOW_IT_WORKS_STEPS: HowItWorksStepData[] = [
  {
    step: "01",
    title: "Patient chats",
    body: "Streaming SSE intake collects symptoms, answers from clinic RAG, and surfaces available slots.",
    imageKey: "chat",
  },
  {
    step: "02",
    title: "AI schedules",
    body: "LangGraph agent books appointments with Redis distributed locks — no double-booking.",
    imageKey: "appointments",
  },
  {
    step: "03",
    title: "Staff escalates",
    body: "Front desk receives real-time alerts for emergencies and human handoffs via Supabase Realtime.",
    imageKey: "frontDesk",
  },
];

export const TRUST_BADGES = [
  "HIPAA-aware architecture",
  "Row-level security",
  "Zero-PHI logs",
  "Multi-tenant JWT",
] as const;
