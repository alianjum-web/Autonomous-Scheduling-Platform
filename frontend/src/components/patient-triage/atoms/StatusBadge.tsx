import { Badge } from "@/components/ui/badge";
import type { TriageStatus } from "@/components/patient-triage/store/triageSlice";

const STATUS_LABELS: Record<TriageStatus, string> = {
  idle: "Ready",
  connecting: "Connecting",
  streaming: "Live",
  completed: "Complete",
  error: "Error",
  reconnecting: "Reconnecting",
};

const STATUS_VARIANT: Record<TriageStatus, "default" | "secondary" | "destructive" | "outline"> = {
  idle: "outline",
  connecting: "secondary",
  streaming: "default",
  completed: "secondary",
  error: "destructive",
  reconnecting: "secondary",
};

export function StatusBadge({ status }: { status: TriageStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
}
