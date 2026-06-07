import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  iconClassName?: string;
  children?: ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  trend,
  trendUp,
  icon: Icon,
  iconClassName,
  children,
  className,
}: StatCardProps) {
  return (
    <div className={cn("dashboard-card flex flex-col gap-4 p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {trend ? (
            <p
              className={cn(
                "text-xs font-medium",
                trendUp === true && "text-success",
                trendUp === false && "text-destructive",
                trendUp === undefined && "text-muted-foreground",
              )}
            >
              {trend}
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary",
            iconClassName,
          )}
        >
          <Icon className="size-5" aria-hidden />
        </div>
      </div>
      {children ? <div className="min-h-[60px] flex-1">{children}</div> : null}
    </div>
  );
}
