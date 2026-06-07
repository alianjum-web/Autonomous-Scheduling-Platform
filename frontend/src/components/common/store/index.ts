import { configureStore } from "@reduxjs/toolkit";

import appointmentsReducer from "@/components/appointments/store/appointmentsSlice";
import clinicDocsReducer from "@/components/clinic-docs/store/clinicDocsSlice";
import bookingReducer from "@/components/patient-triage/store/bookingSlice";
import triageReducer from "@/components/patient-triage/store/triageSlice";

import { baseApi } from "./baseApi";

import "@/components/appointments/store/appointmentsApi";
import "@/components/clinic-docs/store/clinicDocsApi";
import "@/components/patient-triage/store/bookingApi";
import "@/components/patient-triage/store/triageApi";

export const makeStore = () =>
  configureStore({
    reducer: {
      triage: triageReducer,
      booking: bookingReducer,
      appointments: appointmentsReducer,
      clinicDocs: clinicDocsReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
