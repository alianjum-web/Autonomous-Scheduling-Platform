import { ClinicalImage } from "@/components/common/atoms/ClinicalImage";
import type { HomeFeature } from "@/components/platform/content/homeContent";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function FeatureCard({ title, description, icon: Icon, imageKey }: HomeFeature) {
  return (
    <Card className="dashboard-card-hover h-full overflow-hidden">
      <div className="relative h-44 overflow-hidden sm:h-40">
        <ClinicalImage asset={imageKey} variant="card" className="transition-transform duration-500" />
        <div className="absolute inset-0 bg-linear-to-t from-card via-card/20 to-transparent" />
        <div className="absolute bottom-4 left-4 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
          <Icon className="size-5" aria-hidden />
        </div>
      </div>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="leading-relaxed">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
