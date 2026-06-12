import type { Appointment } from "@/types/appointments";

/** Local calendar date key (YYYY-MM-DD) for an ISO timestamp. */
export function localDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Hour (0–23) in the viewer's local timezone. */
export function localHour(iso: string): number {
  try {
    return new Date(iso).getHours();
  } catch {
    return -1;
  }
}

export function todayDateKey(): string {
  return localDateKey(new Date().toISOString());
}

export function isActiveAppointment(status: string | null | undefined): boolean {
  return status !== "cancelled" && status !== "no_show";
}

/** Bookings that still belong on the schedule / patient history (includes completed today). */
export function isCalendarAppointment(status: string | null | undefined): boolean {
  return isActiveAppointment(status);
}

/** Future or pending visits — excludes completed. */
export function isUpcomingAppointment(status: string | null | undefined): boolean {
  return status === "confirmed" || status === "pending";
}

export function appointmentsOnDate(appointments: Appointment[], date: string): Appointment[] {
  return appointments.filter(
    (a) => isCalendarAppointment(a.status) && localDateKey(a.slot_start) === date,
  );
}

export function upcomingAppointments(
  appointments: Appointment[],
  today: string = todayDateKey(),
): Appointment[] {
  return [...appointments]
    .filter(
      (a) => isUpcomingAppointment(a.status) && localDateKey(a.slot_start) >= today,
    )
    .sort((a, b) => new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime());
}

export function nextAppointmentDate(
  appointments: Appointment[],
  today: string = todayDateKey(),
): string | null {
  const next = upcomingAppointments(appointments, today)[0];
  return next ? localDateKey(next.slot_start) : null;
}

export function appointmentsInWeek(appointments: Appointment[], anchorDate: string): Appointment[] {
  const anchor = new Date(`${anchorDate}T12:00:00`);
  const weekStart = new Date(anchor);
  weekStart.setDate(anchor.getDate() - anchor.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const startKey = localDateKey(weekStart.toISOString());
  const endKey = localDateKey(weekEnd.toISOString());

  return [...appointments]
    .filter((a) => {
      if (!isActiveAppointment(a.status)) return false;
      const key = localDateKey(a.slot_start);
      return key >= startKey && key <= endKey;
    })
    .sort((a, b) => new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime());
}
