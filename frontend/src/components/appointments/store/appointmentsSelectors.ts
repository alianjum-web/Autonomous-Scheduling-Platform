import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "@/components/common/store";

export const selectAppointmentsState = (state: RootState) => state.appointments;

export const selectAppointments = (state: RootState) => state.appointments.appointments;
export const selectEscalations = (state: RootState) => state.appointments.escalations;
export const selectSelectedDate = (state: RootState) => state.appointments.selectedDate;
export const selectViewMode = (state: RootState) => state.appointments.viewMode;
export const selectAppointmentFilters = (state: RootState) => state.appointments.filters;
export const selectSelectedAppointmentId = (state: RootState) =>
  state.appointments.selectedAppointmentId;

export const selectSelectedAppointment = createSelector(
  [selectAppointments, selectSelectedAppointmentId],
  (appointments, id) => (id ? (appointments.find((a) => a.id === id) ?? null) : null),
);

export const selectEscalationCount = createSelector(
  [selectEscalations],
  (escalations) => escalations.length,
);
