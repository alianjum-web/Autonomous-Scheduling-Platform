import { cn } from "@/lib/utils";
import type { BookingStep } from "@/store/bookingSlice";

const STEPS = [
  { key: "chat", label: "Chat" },
  { key: "select", label: "Select Slot" },
  { key: "confirm", label: "Confirm" },
  { key: "complete", label: "Booked" },
  { key: "done", label: "Done" },
] as const;

function stepIndex(bookingStep: BookingStep, hasSlots: boolean): number {
  if (bookingStep === "complete") return 3;
  if (bookingStep === "confirm") return 2;
  if (bookingStep === "select" || hasSlots) return 1;
  return 0;
}

export function TriageStatusBar({
  bookingStep,
  hasSlots = false,
}: {
  bookingStep: BookingStep;
  hasSlots?: boolean;
}) {
  const active = stepIndex(bookingStep, hasSlots);

  return (
    <div className="flex items-center gap-1 px-1">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex flex-1 items-center gap-1">
          <div className="flex flex-col items-center gap-1 flex-1">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                i <= active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {i + 1}
            </div>
            <span className="hidden text-[10px] text-muted-foreground sm:block">{step.label}</span>
          </div>
          {i < STEPS.length - 1 ? (
            <div className={cn("h-0.5 flex-1", i < active ? "bg-primary" : "bg-muted")} />
          ) : null}
        </div>
      ))}
    </div>
  );
}
