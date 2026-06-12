import { ShieldCheck } from "lucide-react";

export function TrustBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground">
      <ShieldCheck className="size-3.5 text-primary" aria-hidden />
      {label}
    </span>
  );
}
