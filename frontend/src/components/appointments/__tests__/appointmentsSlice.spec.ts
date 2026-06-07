import { describe, expect, it } from "vitest";

import appointmentsReducer, {
  addEscalation,
  dismissEscalation,
  removeAppointment,
  setAppointments,
  setSelectedAppointment,
  upsertAppointment,
  type Appointment,
  type Escalation,
} from "../store/appointmentsSlice";

const sampleAppointment: Appointment = {
  id: "appt-1",
  tenant_id: "tenant-1",
  session_id: null,
  patient_name: "Jane Doe",
  patient_phone: null,
  slot_start: "2026-06-10T09:00:00Z",
  slot_end: "2026-06-10T09:30:00Z",
  confirmation_code: "AB12CD34",
  calendar_event_id: null,
  status: "confirmed",
  created_at: "2026-01-01T00:00:00Z",
  provider_name: "General Practice",
  treatment_type: "consultation",
  scheduled_timestamp: "2026-06-10T09:00:00Z",
  duration_minutes: 30,
  external_event_id: null,
};

const sampleEscalation: Escalation = {
  id: "sess-1",
  tenant_id: "tenant-1",
  patient_name: "John Doe",
  current_triage_status: "escalated_to_human",
  status: "active",
};

describe("appointmentsSlice", () => {
  it("sets appointments list", () => {
    const state = appointmentsReducer(undefined, setAppointments([sampleAppointment]));
    expect(state.appointments).toHaveLength(1);
  });

  it("upserts appointment by id", () => {
    let state = appointmentsReducer(undefined, upsertAppointment(sampleAppointment));
    const updated = { ...sampleAppointment, patient_name: "Jane Smith" };
    state = appointmentsReducer(state, upsertAppointment(updated));
    expect(state.appointments).toHaveLength(1);
    expect(state.appointments[0].patient_name).toBe("Jane Smith");
  });

  it("removes appointment", () => {
    let state = appointmentsReducer(undefined, setAppointments([sampleAppointment]));
    state = appointmentsReducer(state, removeAppointment("appt-1"));
    expect(state.appointments).toHaveLength(0);
  });

  it("adds and dismisses escalations", () => {
    let state = appointmentsReducer(undefined, addEscalation(sampleEscalation));
    expect(state.escalations).toHaveLength(1);
    state = appointmentsReducer(state, dismissEscalation("sess-1"));
    expect(state.escalations).toHaveLength(0);
  });

  it("selects appointment", () => {
    const state = appointmentsReducer(undefined, setSelectedAppointment("appt-1"));
    expect(state.selectedAppointmentId).toBe("appt-1");
  });
});
