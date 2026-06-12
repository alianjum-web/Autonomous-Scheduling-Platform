import { HOME_FEATURES } from "@/components/platform/content/homeContent";
import { FeatureCard } from "@/components/platform/molecules/FeatureCard";

export function MarketingFeaturesSection() {
  return (
    <section id="features" className="mesh-bg py-20 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Built for clinic teams & patients</h2>
          <p className="mt-3 text-muted-foreground">
            Owners manage the clinic. Doctors join by invite. Patients book without creating an account.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {HOME_FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
