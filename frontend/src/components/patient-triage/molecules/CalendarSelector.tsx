"use client";

import { TimeSlotChip } from "@/components/patient-triage/atoms/TimeSlotChip";
import { Skeleton } from "@/components/ui/skeleton";
import type { AvailableSlot } from "@/components/patient-triage/store/bookingSlice";

interface CalendarSelectorProps {
  slots: AvailableSlot[];
  selectedSlot: string | null;
  loading?: boolean;
  onSelect: (iso: string) => void;
}

export function CalendarSelector({ slots, selectedSlot, loading, onSelect }: CalendarSelectorProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-full" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return <p className="text-sm text-muted-foreground">No available slots at this time.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {slots.map((slot) => (
        <TimeSlotChip
          key={slot.iso}
          label={
            slot.status === "reserving"
              ? `${slot.label} (reserving…)`
              : slot.status === "confirmed"
                ? `${slot.label} ✓`
                : slot.status === "unavailable"
                  ? `${slot.label} (taken)`
                  : slot.label
          }
          selected={selectedSlot === slot.iso}
          disabled={slot.status === "reserving" || slot.status === "unavailable" || slot.status === "confirmed"}
          onClick={() => slot.status === "available" && onSelect(slot.iso)}
        />
      ))}
    </div>
  );
}
