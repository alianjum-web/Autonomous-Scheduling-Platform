"use client";

import { useMemo } from "react";

import { useReduxForm } from "@/components/common/hooks/useReduxForm";
import { useAppDispatch, useAppSelector } from "@/components/common/store/hooks";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CalendarSelector } from "@/components/patient-triage/molecules/CalendarSelector";
import { useBookingFlow } from "@/components/patient-triage/hooks/useBookingFlow";
import {
  selectAvailableSlots,
  selectBookingStep,
  selectPatientName,
  selectPatientPhone,
} from "@/components/patient-triage/store/bookingSelectors";
import { setPatientInfo } from "@/components/patient-triage/store/bookingSlice";

interface SlotBookingDrawerProps {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
}

interface BookingPatientForm {
  patientName: string;
  patientPhone: string;
}

export function SlotBookingDrawer({ open, onClose, sessionId }: SlotBookingDrawerProps) {
  const dispatch = useAppDispatch();
  const availableSlots = useAppSelector(selectAvailableSlots);
  const bookingStep = useAppSelector(selectBookingStep);
  const patientName = useAppSelector(selectPatientName);
  const patientPhone = useAppSelector(selectPatientPhone);
  const { selectedSlot, reserving, chooseSlot, confirmBooking } = useBookingFlow(sessionId);

  const formValues = useMemo(
    () => ({ patientName, patientPhone }),
    [patientName, patientPhone],
  );
  const form = useReduxForm<BookingPatientForm>(formValues);

  if (!open) return null;

  const onSubmit = form.handleSubmit(async () => {
    try {
      await confirmBooking();
    } catch {
      /* toast shown in useBookingFlow */
    }
  });

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
            <Form {...form}>
              <form onSubmit={onSubmit} className="mt-6 space-y-3">
                <FormField
                  control={form.control}
                  name="patientName"
                  rules={{ required: "Full name is required to confirm your booking." }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Full name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jane Doe"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            dispatch(
                              setPatientInfo({ name: e.target.value, phone: patientPhone }),
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="patientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Optional — E.164 format"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            dispatch(
                              setPatientInfo({ name: patientName, phone: e.target.value }),
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button className="w-full" type="submit" disabled={reserving || !patientName.trim()}>
                  {reserving ? "Reserving…" : "Confirm Booking"}
                </Button>
              </form>
            </Form>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}
