import { describe, expect, it } from "vitest";

import bookingReducer, {
  revertReservation,
  selectSlot,
  setAvailableSlots,
  setBookingConfirmed,
  setReserving,
  setSlotStatus,
} from "./bookingSlice";

describe("bookingSlice", () => {
  it("sets available slots and moves to select step", () => {
    const state = bookingReducer(undefined, setAvailableSlots(["2026-06-10T09:00:00Z"]));
    expect(state.availableSlots).toHaveLength(1);
    expect(state.bookingStep).toBe("select");
  });

  it("selects slot and moves to confirm", () => {
    let state = bookingReducer(undefined, setAvailableSlots(["2026-06-10T09:00:00Z"]));
    state = bookingReducer(state, selectSlot("2026-06-10T09:00:00Z"));
    expect(state.selectedSlot).toBe("2026-06-10T09:00:00Z");
    expect(state.bookingStep).toBe("confirm");
  });

  it("marks slot as reserving immediately (optimistic UI)", () => {
    let state = bookingReducer(undefined, setAvailableSlots(["2026-06-10T09:00:00Z"]));
    state = bookingReducer(state, selectSlot("2026-06-10T09:00:00Z"));
    state = bookingReducer(state, setSlotStatus({ slot: "2026-06-10T09:00:00Z", status: "reserving" }));
    expect(state.availableSlots[0].status).toBe("reserving");
    expect(state.reserving).toBe(true);
  });

  it("marks slot unavailable on race loss", () => {
    let state = bookingReducer(undefined, setAvailableSlots(["2026-06-10T09:00:00Z"]));
    state = bookingReducer(state, selectSlot("2026-06-10T09:00:00Z"));
    state = bookingReducer(state, setSlotStatus({ slot: "2026-06-10T09:00:00Z", status: "unavailable" }));
    expect(state.availableSlots[0].status).toBe("unavailable");
    expect(state.reserving).toBe(false);
  });

  it("optimistically reserves and reverts on failure", () => {
    let state = bookingReducer(undefined, setAvailableSlots(["2026-06-10T09:00:00Z"]));
    state = bookingReducer(state, selectSlot("2026-06-10T09:00:00Z"));
    state = bookingReducer(state, setReserving(true));
    expect(state.availableSlots[0].status).toBe("reserving");
    state = bookingReducer(state, revertReservation());
    expect(state.availableSlots[0].status).toBe("available");
  });

  it("completes booking with confirmation code", () => {
    let state = bookingReducer(undefined, setAvailableSlots(["2026-06-10T09:00:00Z"]));
    state = bookingReducer(
      state,
      setBookingConfirmed({ code: "AB12CD34", slot: "2026-06-10T09:00:00Z" }),
    );
    expect(state.bookingStep).toBe("complete");
    expect(state.confirmationCode).toBe("AB12CD34");
    expect(state.availableSlots[0].status).toBe("confirmed");
  });
});
