import { AlertTriangle, Phone } from "lucide-react";

import { EMERGENCY_LEGAL_DISCLAIMER } from "@/lib/emergencyKeywords";
import { cn } from "@/lib/utils";

interface EmergencyBannerProps {
  /** Layer 1: triggered by client-side keyword detection on keypress */
  active?: boolean;
}

export function EmergencyBanner({ active = false }: EmergencyBannerProps) {
  return (
    <div
      role="alert"
      aria-live={active ? "assertive" : "polite"}
      className={cn(
        "flex flex-col gap-2 rounded-md border px-4 py-3 text-sm",
        active
          ? "border-destructive bg-destructive text-destructive-foreground animate-pulse"
          : "border-destructive/50 bg-destructive/10 text-destructive",
      )}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          {active ? (
            <>
              <p className="font-semibold">Possible medical emergency detected</p>
              <p className="mt-1">
                Call{" "}
                <a
                  href="tel:911"
                  className="inline-flex items-center gap-1 font-bold underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  911
                </a>{" "}
                immediately or go to your nearest emergency room.
              </p>
            </>
          ) : (
            <p>
              <strong>Medical emergency?</strong> Call{" "}
              <a href="tel:911" className="inline-flex items-center gap-1 font-semibold underline">
                <Phone className="h-3.5 w-3.5" />
                911
              </a>{" "}
              immediately or go to your nearest emergency room.
            </p>
          )}
          <p className={cn("mt-2 text-xs", active ? "opacity-90" : "text-destructive/80")}>
            {EMERGENCY_LEGAL_DISCLAIMER}
          </p>
        </div>
      </div>
    </div>
  );
}
