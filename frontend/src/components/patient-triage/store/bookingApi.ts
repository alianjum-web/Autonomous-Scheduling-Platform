import { baseApi } from "@/components/common/store/baseApi";
import type { Appointment } from "@/components/appointments/store/appointmentsSlice";

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAvailableSlots: builder.query<{ slots: string[] }, void>({
      query: () => "/v1/schedule/slots",
      keepUnusedDataFor: 30,
    }),
    bookAppointment: builder.mutation<
      {
        appointment: Appointment;
        confirmation_code: string;
        slot_start: string;
        slot_end: string;
        status: string;
      },
      {
        slot_start: string;
        patient_name: string;
        patient_phone?: string;
        session_id?: string;
        provider_name?: string;
        treatment_type?: string;
      }
    >({
      query: (body) => ({
        url: "/v1/schedule/book",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Appointments"],
    }),
  }),
});

export const { useGetAvailableSlotsQuery, useBookAppointmentMutation } = bookingApi;
