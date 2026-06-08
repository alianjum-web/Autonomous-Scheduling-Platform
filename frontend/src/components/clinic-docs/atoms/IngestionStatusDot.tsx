import { cn } from "@/lib/utils";
import type { IngestionJobStatus } from "@/types/clinic-docs";

const STATUS_COLORS: Record<IngestionJobStatus, string> = {
  pending: "bg-muted-foreground",
  processing: "bg-blue-500 animate-pulse",
  completed: "bg-green-500",
  failed: "bg-destructive",
  partial: "bg-amber-500",
};

export function IngestionStatusDot({ status }: { status: IngestionJobStatus }) {
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 rounded-full", STATUS_COLORS[status])}
      title={status}
      aria-label={`Status: ${status}`}
    />
  );
}
