"use client";

import type { Appointment } from "@/types/appointments";
import { isCalendarAppointment, localDateKey, localHour } from "@/lib/scheduling/appointmentTime";
import { cn } from "@/lib/utils";

const BASE_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

interface DailyCalendarGridProps {
  appointments: Appointment[];
  date: string;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function DailyCalendarGrid({
  appointments,
  date,
  selectedId,
  onSelect,
}: DailyCalendarGridProps) {
  const dayAppts = appointments.filter(
    (a) => localDateKey(a.slot_start) === date && isCalendarAppointment(a.status),
  );
  const hours = [
    ...new Set([...BASE_HOURS, ...dayAppts.map((a) => localHour(a.slot_start))]),
  ].sort((a, b) => a - b);

  if (dayAppts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/70 py-8 text-center text-sm text-muted-foreground">
        No appointments on this day. Select another date or check upcoming bookings below.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-[4rem_1fr] gap-px overflow-hidden rounded-lg border bg-border">
      {hours.map((hour) => {
        const slotAppts = dayAppts.filter((a) => localHour(a.slot_start) === hour);
        return (
          <div key={hour} className="contents">
            <div className="bg-muted/30 px-2 py-3 text-right text-xs text-muted-foreground">
              {hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`}
            </div>
            <div className="min-h-12 bg-background px-2 py-1">
              {slotAppts.map((a) => {
                const selected = a.id === selectedId;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onSelect?.(a.id)}
                    className={cn(
                      "mb-1 block w-full rounded-md border px-2 py-1.5 text-left text-xs transition-colors",
                      selected
                        ? "border-primary bg-primary/15 ring-1 ring-primary/30"
                        : "border-transparent bg-primary/10 hover:border-primary/30 hover:bg-primary/15",
                    )}
                  >
                    <span className="font-medium">{a.patient_name}</span>
                    <span className="mt-0.5 block text-muted-foreground">
                      {formatSlotTime(a.slot_start)}
                      {a.treatment_type ? ` · ${a.treatment_type}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
