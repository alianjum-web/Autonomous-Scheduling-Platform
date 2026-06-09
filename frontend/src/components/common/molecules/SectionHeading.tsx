import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  children: ReactNode;
  icon?: LucideIcon;
  description?: string;
  className?: string;
}

export function SectionHeading({ children, icon: Icon, description, className }: SectionHeadingProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <h2 className="section-heading flex items-center gap-2.5">
        {Icon ? <Icon className="size-5 shrink-0 text-primary" aria-hidden /> : null}
        {children}
      </h2>
      {description ? <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
    </div>
  );
}
