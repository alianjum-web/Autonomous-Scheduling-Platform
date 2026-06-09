import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

import { ClinicalImage } from "@/components/common/atoms/ClinicalImage";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImageAssetKey } from "@/lib/constants/images";

interface GuideCardProps {
  title: string;
  description: string;
  href: string;
  cta: string;
  imageKey: ImageAssetKey;
  icon: LucideIcon;
}

export function GuideCard({ title, description, href, cta, imageKey, icon: Icon }: GuideCardProps) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="dashboard-card-hover flex h-full flex-col overflow-hidden">
        <div className="relative h-36 overflow-hidden sm:h-40">
          <ClinicalImage
            asset={imageKey}
            variant="card"
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-card via-card/25 to-transparent" />
          <div className="absolute bottom-3 left-3 flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Icon className="size-4" aria-hidden />
          </div>
        </div>
        <CardHeader className="flex-1 pb-4">
          <CardTitle className="flex items-center justify-between gap-2 text-lg">
            {title}
            <ArrowRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
              aria-hidden
            />
          </CardTitle>
          <CardDescription className="leading-relaxed">{description}</CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 pt-0">
          <span className="text-sm font-medium text-primary">
            {cta}
            <span className="sr-only"> — {title}</span>
          </span>
        </div>
      </Card>
    </Link>
  );
}
