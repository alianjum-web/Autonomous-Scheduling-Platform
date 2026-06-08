export type BookingStep = "idle" | "select" | "confirm" | "complete";

export type SlotStatus = "available" | "reserving" | "confirmed" | "unavailable";

export interface AvailableSlot {
  iso: string;
  label: string;
  status: SlotStatus;
}
