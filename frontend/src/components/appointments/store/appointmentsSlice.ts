import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AppointmentStatus } from "@/types/database";
import type { Appointment, Escalation, ViewMode } from "@/types/appointments";

export type { Appointment, AppointmentStatus, Escalation, ViewMode };

export interface AppointmentsState {
  appointments: Appointment[];
  escalations: Escalation[];
  filters: { status: AppointmentStatus | "all"; provider: string };
  selectedDate: string;
  viewMode: ViewMode;
  selectedAppointmentId: string | null;
}

const today = new Date().toISOString().slice(0, 10);

const initialState: AppointmentsState = {
  appointments: [],
  escalations: [],
  filters: { status: "all", provider: "all" },
  selectedDate: today,
  viewMode: "day",
  selectedAppointmentId: null,
};

const appointmentsSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    setAppointments(state, action: PayloadAction<Appointment[]>) {
      state.appointments = action.payload;
    },
    upsertAppointment(state, action: PayloadAction<Appointment>) {
      const idx = state.appointments.findIndex((a) => a.id === action.payload.id);
      if (idx >= 0) state.appointments[idx] = action.payload;
      else state.appointments.push(action.payload);
    },
    removeAppointment(state, action: PayloadAction<string>) {
      state.appointments = state.appointments.filter((a) => a.id !== action.payload);
    },
    addEscalation(state, action: PayloadAction<Escalation>) {
      if (!state.escalations.find((e) => e.id === action.payload.id)) {
        state.escalations.unshift(action.payload);
      }
    },
    dismissEscalation(state, action: PayloadAction<string>) {
      state.escalations = state.escalations.filter((e) => e.id !== action.payload);
    },
    setSelectedDate(state, action: PayloadAction<string>) {
      state.selectedDate = action.payload;
    },
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
    },
    setFilters(state, action: PayloadAction<Partial<AppointmentsState["filters"]>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSelectedAppointment(state, action: PayloadAction<string | null>) {
      state.selectedAppointmentId = action.payload;
    },
    resetAppointments() {
      return initialState;
    },
  },
});

export const {
  setAppointments,
  upsertAppointment,
  removeAppointment,
  addEscalation,
  dismissEscalation,
  setSelectedDate,
  setViewMode,
  setFilters,
  setSelectedAppointment,
  resetAppointments,
} = appointmentsSlice.actions;

export default appointmentsSlice.reducer;
