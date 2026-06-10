"use client";

import { CalendarSelector } from "@/components/patient-triage/molecules/CalendarSelector";
import type { AvailableSlot } from "@/types/booking";

interface InlineSlotPickerProps {
  slots: AvailableSlot[];
  selectedSlot: string | null;
  disabled?: boolean;
  onSelect: (iso: string) => void;
}

export function InlineSlotPicker({
  slots,
  selectedSlot,
  disabled,
  onSelect,
}: InlineSlotPickerProps) {
  if (slots.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <p className="mb-3 text-sm font-medium">Pick a time — we&apos;ll confirm in chat</p>
      <CalendarSelector
        slots={slots}
        selectedSlot={selectedSlot}
        onSelect={onSelect}
      />
    </div>
  );
}
