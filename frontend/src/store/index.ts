import { configureStore } from "@reduxjs/toolkit";

import { api } from "./api";
import appointmentsReducer from "./appointmentsSlice";
import bookingReducer from "./bookingSlice";
import clinicDocsReducer from "./clinicDocsSlice";
import triageReducer from "./triageSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      triage: triageReducer,
      booking: bookingReducer,
      appointments: appointmentsReducer,
      clinicDocs: clinicDocsReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
