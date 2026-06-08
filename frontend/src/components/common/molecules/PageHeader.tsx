import type { ReactNode } from "react";

import { ClinicalImage } from "@/components/common/atoms/ClinicalImage";
import type { ImageAssetKey } from "@/lib/constants/images";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  imageKey?: ImageAssetKey;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  imageKey,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-2xl dashboard-card",
        imageKey ? "grid gap-0 lg:grid-cols-[1fr_280px]" : "",
        className,
      )}
    >
      <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</span>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
        {actions ? <div className="mt-2 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {imageKey ? (
        <div className="relative hidden min-h-[160px] lg:block">
          <ClinicalImage asset={imageKey} variant="header" />
          <div className="absolute inset-0 bg-linear-to-r from-card via-card/40 to-transparent" />
        </div>
      ) : null}
    </header>
  );
}
