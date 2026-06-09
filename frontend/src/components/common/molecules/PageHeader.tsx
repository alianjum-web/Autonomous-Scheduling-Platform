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
        "relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-br from-card via-card to-muted/15",
        imageKey ? "grid gap-0 md:grid-cols-[1fr_240px] lg:grid-cols-[1fr_300px]" : "",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-info to-primary/40" />

      <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
        {eyebrow ? <span className="section-eyebrow">{eyebrow}</span> : null}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        {actions ? <div className="flex flex-wrap gap-2 pt-1">{actions}</div> : null}
      </div>

      {imageKey ? (
        <div className="relative hidden min-h-[180px] md:block">
          <ClinicalImage asset={imageKey} variant="header" />
          <div className="absolute inset-0 bg-linear-to-r from-card via-card/50 to-transparent" />
        </div>
      ) : null}
    </header>
  );
}
