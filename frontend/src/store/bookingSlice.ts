import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type BookingStep = "idle" | "select" | "confirm" | "complete";

export type SlotStatus = "available" | "reserving" | "confirmed" | "unavailable";

export interface AvailableSlot {
  iso: string;
  label: string;
  status: SlotStatus;
}

export interface BookingState {
  availableSlots: AvailableSlot[];
  selectedSlot: string | null;
  bookingStep: BookingStep;
  confirmationCode: string | null;
  patientName: string;
  patientPhone: string;
  reserving: boolean;
}

const initialState: BookingState = {
  availableSlots: [],
  selectedSlot: null,
  bookingStep: "idle",
  confirmationCode: null,
  patientName: "",
  patientPhone: "",
  reserving: false,
};

function formatSlotLabel(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function findSlot(state: BookingState, iso: string) {
  return state.availableSlots.find((s) => s.iso === iso);
}

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    setAvailableSlots(state, action: PayloadAction<string[]>) {
      state.availableSlots = action.payload.map((iso) => ({
        iso,
        label: formatSlotLabel(iso),
        status: "available",
      }));
      if (action.payload.length > 0 && state.bookingStep === "idle") {
        state.bookingStep = "select";
      }
    },
    selectSlot(state, action: PayloadAction<string>) {
      state.selectedSlot = action.payload;
      state.bookingStep = "confirm";
    },
    setSlotStatus(state, action: PayloadAction<{ slot: string; status: SlotStatus }>) {
      const { slot, status } = action.payload;
      const entry = findSlot(state, slot);
      if (entry) entry.status = status;
      if (status === "reserving") {
        state.selectedSlot = slot;
        state.reserving = true;
      } else if (status === "confirmed") {
        state.reserving = false;
        state.bookingStep = "complete";
      } else if (status === "unavailable") {
        state.reserving = false;
      }
    },
    setReserving(state, action: PayloadAction<boolean>) {
      state.reserving = action.payload;
      if (action.payload && state.selectedSlot) {
        const slot = findSlot(state, state.selectedSlot);
        if (slot) slot.status = "reserving";
      }
    },
    setBookingConfirmed(state, action: PayloadAction<{ code: string; slot: string }>) {
      state.confirmationCode = action.payload.code;
      state.selectedSlot = action.payload.slot;
      state.bookingStep = "complete";
      state.reserving = false;
      const slot = findSlot(state, action.payload.slot);
      if (slot) slot.status = "confirmed";
    },
    revertReservation(state) {
      state.reserving = false;
      if (state.selectedSlot) {
        const slot = findSlot(state, state.selectedSlot);
        if (slot) slot.status = "available";
      }
    },
    setPatientInfo(state, action: PayloadAction<{ name: string; phone: string }>) {
      state.patientName = action.payload.name;
      state.patientPhone = action.payload.phone;
    },
    resetBooking() {
      return initialState;
    },
  },
});

export const {
  setAvailableSlots,
  selectSlot,
  setSlotStatus,
  setReserving,
  setBookingConfirmed,
  revertReservation,
  setPatientInfo,
  resetBooking,
} = bookingSlice.actions;

export default bookingSlice.reducer;
