import { ClinicalImage } from "@/components/common/atoms/ClinicalImage";
import type { HowItWorksStepData } from "@/components/platform/content/homeContent";

export function HowItWorksStep({ step, title, body, imageKey }: HowItWorksStepData) {
  return (
    <div className="dashboard-card relative overflow-hidden bg-background">
      <div className="relative h-36">
        <ClinicalImage asset={imageKey} variant="thumb" />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
      </div>
      <div className="space-y-3 p-6">
        <span className="text-4xl font-bold text-primary/20">{step}</span>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
