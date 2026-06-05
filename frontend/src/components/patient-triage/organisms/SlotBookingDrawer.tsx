"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarSelector } from "@/components/patient-triage/molecules/CalendarSelector";
import { useBookingFlow } from "@/hooks/useBookingFlow";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

interface SlotBookingDrawerProps {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
}

export function SlotBookingDrawer({ open, onClose, sessionId }: SlotBookingDrawerProps) {
  const { availableSlots, bookingStep } = useSelector((state: RootState) => state.booking);
  const {
    selectedSlot,
    patientName,
    patientPhone,
    reserving,
    chooseSlot,
    confirmBooking,
    updatePatientInfo,
  } = useBookingFlow(sessionId);

  if (!open) return null;

  const handleConfirm = async () => {
    try {
      await confirmBooking();
    } catch {
      /* toast shown in useBookingFlow */
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l bg-background p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Book Appointment</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      {bookingStep === "select" || bookingStep === "confirm" ? (
        <>
          <p className="mb-3 text-sm text-muted-foreground">Select an available time:</p>
          <CalendarSelector
            slots={availableSlots}
            selectedSlot={selectedSlot}
            onSelect={chooseSlot}
          />

          {bookingStep === "confirm" && selectedSlot ? (
            <div className="mt-6 space-y-3">
              <Input
                placeholder="Your full name"
                value={patientName}
                onChange={(e) => updatePatientInfo(e.target.value, patientPhone)}
              />
              <Input
                placeholder="Phone number (optional)"
                value={patientPhone}
                onChange={(e) => updatePatientInfo(patientName, e.target.value)}
              />
              <Button className="w-full" onClick={handleConfirm} disabled={reserving || !patientName}>
                {reserving ? "Reserving…" : "Confirm Booking"}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}
