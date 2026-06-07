"use client";

import type { Appointment } from "@/components/appointments/store/appointmentsSlice";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

function hourFromIso(iso: string) {
  try {
    return new Date(iso).getHours();
  } catch {
    return -1;
  }
}

interface DailyCalendarGridProps {
  appointments: Appointment[];
  date: string;
  onSelect?: (id: string) => void;
}

export function DailyCalendarGrid({ appointments, date, onSelect }: DailyCalendarGridProps) {
  const dayAppts = appointments.filter((a) => a.slot_start.startsWith(date));

  return (
    <div className="grid grid-cols-[4rem_1fr] gap-px rounded-lg border bg-border overflow-hidden">
      {HOURS.map((hour) => {
        const slotAppts = dayAppts.filter((a) => hourFromIso(a.slot_start) === hour);
        return (
          <div key={hour} className="contents">
            <div className="bg-muted/30 px-2 py-3 text-xs text-muted-foreground text-right">
              {hour > 12 ? hour - 12 : hour}{hour >= 12 ? "pm" : "am"}
            </div>
            <div className="min-h-12 bg-background px-2 py-1">
              {slotAppts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelect?.(a.id)}
                  className="mb-1 block w-full rounded bg-primary/10 px-2 py-1 text-left text-xs hover:bg-primary/20"
                >
                  <span className="font-medium">{a.patient_name}</span>
                  <span className="ml-2 text-muted-foreground">{a.treatment_type}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
