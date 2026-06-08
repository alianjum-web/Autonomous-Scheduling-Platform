import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "@/components/common/store";

export const selectBookingState = (state: RootState) => state.booking;

export const selectAvailableSlots = (state: RootState) => state.booking.availableSlots;
export const selectSelectedSlot = (state: RootState) => state.booking.selectedSlot;
export const selectBookingStep = (state: RootState) => state.booking.bookingStep;
export const selectConfirmationCode = (state: RootState) => state.booking.confirmationCode;
export const selectPatientName = (state: RootState) => state.booking.patientName;
export const selectPatientPhone = (state: RootState) => state.booking.patientPhone;
export const selectBookingReserving = (state: RootState) => state.booking.reserving;
export const selectDismissedSlotsKey = (state: RootState) => state.booking.dismissedSlotsKey;

export const selectSlotsKey = createSelector([selectAvailableSlots], (slots) =>
  slots.map((s) => s.iso).join("|"),
);

export const selectBookingDrawerOpen = createSelector(
  [selectSlotsKey, selectDismissedSlotsKey],
  (slotsKey, dismissedKey) => slotsKey.length > 0 && dismissedKey !== slotsKey,
);

export const selectBookingComplete = createSelector(
  [selectBookingStep, selectConfirmationCode, selectSelectedSlot],
  (step, code, slot) => step === "complete" && Boolean(code) && Boolean(slot),
);
