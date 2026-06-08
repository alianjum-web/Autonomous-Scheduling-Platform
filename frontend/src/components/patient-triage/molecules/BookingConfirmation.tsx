"use client";

import { CalendarPlus, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BookingConfirmationProps {
  confirmationCode: string;
  slotStart: string;
  onClose?: () => void;
}

function formatSlot(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function googleCalendarUrl(slotStart: string, code: string) {
  const start = new Date(slotStart);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Medical Appointment (${code})`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Confirmation code: ${code}`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function BookingConfirmation({
  confirmationCode,
  slotStart,
  onClose,
}: BookingConfirmationProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center">
      <CheckCircle2 className="h-12 w-12 text-green-500" />
      <h2 className="text-xl font-semibold">Appointment Confirmed</h2>
      <p className="text-muted-foreground">{formatSlot(slotStart)}</p>
      <div className="rounded-lg bg-muted px-6 py-3">
        <p className="text-xs text-muted-foreground">Confirmation Code</p>
        <p className="text-2xl font-mono font-bold tracking-widest">{confirmationCode}</p>
      </div>
      <Button asChild variant="outline">
        <a href={googleCalendarUrl(slotStart, confirmationCode)} target="_blank" rel="noopener noreferrer">
          <CalendarPlus className="mr-2 h-4 w-4" />
          Add to Google Calendar
        </a>
      </Button>
      {onClose ? (
        <Button variant="ghost" onClick={onClose}>
          Back to Chat
        </Button>
      ) : null}
    </div>
  );
}
