import { Sparkles } from "lucide-react";

import { ClinicalImage } from "@/components/common/atoms/ClinicalImage";
import { TrustBadge } from "@/components/platform/atoms/TrustBadge";
import { TRUST_BADGES } from "@/components/platform/content/homeContent";
import { MarketingCtaGroup } from "@/components/platform/molecules/MarketingCtaGroup";

export function MarketingHeroSection() {
  return (
    <section className="page-gradient relative overflow-hidden border-b border-border/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="size-4" aria-hidden />
            AI-first clinical scheduling
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Welcome to <span className="text-gradient">Symptra</span> — AI scheduling that feels
              premium
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              High-trust medical and dental clinics use our platform for streaming AI triage,
              autonomous booking, and real-time staff handoffs — all tenant-isolated and
              compliance-ready.
            </p>
          </div>
          <MarketingCtaGroup variant="hero" />
          <div className="flex flex-wrap gap-2">
            {TRUST_BADGES.map((badge) => (
              <TrustBadge key={badge} label={badge} />
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="hero-glow relative aspect-4/3 overflow-hidden rounded-2xl border border-border/70">
            <ClinicalImage asset="hero" variant="hero" priority />
            <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent" />
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
  );
}
