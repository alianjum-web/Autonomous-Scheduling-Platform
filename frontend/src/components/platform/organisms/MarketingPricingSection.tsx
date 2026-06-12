import { MarketingPricingCard } from "@/components/platform/molecules/MarketingPricingCard";
import { Card } from "@/components/ui/card";

export function MarketingPricingSection() {
  return (
    <section id="pricing" className="pb-20 scroll-mt-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Simple pricing for clinics</h2>
          <p className="mt-3 text-muted-foreground">
            Start free — patients never pay or sign up to book. You only onboard clinic staff.
          </p>
        </div>
        <Card className="hero-glow overflow-hidden border-primary/20 bg-linear-to-br from-primary/5 via-card to-accent/30">
          <MarketingPricingCard />
        </Card>
      </div>
    </section>
  );
}
