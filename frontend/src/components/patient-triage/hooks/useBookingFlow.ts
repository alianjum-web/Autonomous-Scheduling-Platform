"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { RootState } from "@/components/common/store";
import { showToast } from "@/components/ui/toast";
import {
  useBookAppointmentMutation,
  useGetAvailableSlotsQuery,
} from "@/components/patient-triage/store/bookingApi";
import {
  selectSlot,
  setBookingConfirmed,
  setSlotStatus,
} from "@/components/patient-triage/store/bookingSlice";

export function useBookingFlow(sessionId: string | null) {
  const dispatch = useDispatch();
  const { selectedSlot, bookingStep, patientName, patientPhone, confirmationCode, reserving } =
    useSelector((state: RootState) => state.booking);

  const { data: slotsData, isLoading: slotsLoading } = useGetAvailableSlotsQuery(undefined, {
    skip: bookingStep === "idle",
  });
  const [bookAppointment] = useBookAppointmentMutation();

  const chooseSlot = useCallback(
    (iso: string) => {
      dispatch(selectSlot(iso));
    },
    [dispatch],
  );

  const confirmBooking = useCallback(async () => {
    if (!selectedSlot || !patientName.trim()) return;

    dispatch(setSlotStatus({ slot: selectedSlot, status: "reserving" }));
    try {
      const result = await bookAppointment({
        slot_start: selectedSlot,
        patient_name: patientName,
        patient_phone: patientPhone || undefined,
        session_id: sessionId ?? undefined,
      }).unwrap();

      dispatch(setSlotStatus({ slot: selectedSlot, status: "confirmed" }));
      dispatch(
        setBookingConfirmed({
          code: result.confirmation_code ?? result.appointment?.confirmation_code,
          slot: selectedSlot,
        }),
      );
    } catch {
      dispatch(setSlotStatus({ slot: selectedSlot, status: "unavailable" }));
      showToast({
        title: "Slot unavailable",
        description: "This slot was just taken. Please choose another time.",
        variant: "destructive",
      });
      throw new Error("This slot was just taken. Please choose another time.");
    }
  }, [bookAppointment, dispatch, patientName, patientPhone, selectedSlot, sessionId]);

  return {
    slots: slotsData?.slots ?? [],
    slotsLoading,
    selectedSlot,
    bookingStep,
    confirmationCode,
    patientName,
    patientPhone,
    reserving,
    chooseSlot,
    confirmBooking,
  };
}
