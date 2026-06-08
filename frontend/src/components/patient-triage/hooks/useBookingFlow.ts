"use client";

import { useCallback, useEffect } from "react";

import { showToast } from "@/components/ui/toast";
import {
  useBookAppointmentMutation,
  useGetAvailableSlotsQuery,
} from "@/components/patient-triage/store/bookingApi";
import {
  selectAvailableSlots,
  selectBookingReserving,
  selectBookingStep,
  selectConfirmationCode,
  selectPatientName,
  selectPatientPhone,
  selectSelectedSlot,
} from "@/components/patient-triage/store/bookingSelectors";
import {
  selectSlot,
  setAvailableSlots,
  setBookingConfirmed,
  setSlotStatus,
} from "@/components/patient-triage/store/bookingSlice";
import { useAppDispatch, useAppSelector } from "@/components/common/store/hooks";

export function useBookingFlow(sessionId: string | null) {
  const dispatch = useAppDispatch();
  const availableSlots = useAppSelector(selectAvailableSlots);
  const selectedSlot = useAppSelector(selectSelectedSlot);
  const bookingStep = useAppSelector(selectBookingStep);
  const confirmationCode = useAppSelector(selectConfirmationCode);
  const patientName = useAppSelector(selectPatientName);
  const patientPhone = useAppSelector(selectPatientPhone);
  const reserving = useAppSelector(selectBookingReserving);

  const { data: slotsData, isLoading: slotsLoading } = useGetAvailableSlotsQuery(undefined, {
    skip: bookingStep === "idle" || availableSlots.length > 0,
  });
  const [bookAppointment] = useBookAppointmentMutation();

  useEffect(() => {
    if (slotsData?.slots?.length) {
      dispatch(setAvailableSlots(slotsData.slots));
    }
  }, [dispatch, slotsData]);

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
    availableSlots,
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
