import { resetAppointments } from "@/components/appointments/store/appointmentsSlice";
import { resetClinicDocs } from "@/components/clinic-docs/store/clinicDocsSlice";
import { resetBooking } from "@/components/patient-triage/store/bookingSlice";
import { resetTriage } from "@/components/patient-triage/store/triageSlice";

import { clearAuth } from "./authSlice";
import type { AppDispatch } from "./index";

/** Clears feature slices after sign-out or tenant switch. */
export function resetFeatureState(dispatch: AppDispatch) {
  dispatch(clearAuth());
  dispatch(resetTriage());
  dispatch(resetBooking());
  dispatch(resetClinicDocs());
  dispatch(resetAppointments());
}
