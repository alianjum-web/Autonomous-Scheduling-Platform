import { HOW_IT_WORKS_STEPS } from "@/components/platform/content/homeContent";
import { HowItWorksStep } from "@/components/platform/molecules/HowItWorksStep";

export function MarketingHowItWorksSection() {
  return (
    <section className="border-y border-border/70 bg-card/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <HowItWorksStep key={step.step} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}
