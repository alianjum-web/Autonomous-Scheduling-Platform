import { baseApi } from "@/components/common/store/baseApi";
import type { Appointment } from "./appointmentsSlice";

export const appointmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAppointments: builder.query<{ appointments: Appointment[] }, string | void>({
      query: (date) => ({
        url: "/v1/schedule/appointments",
        params: date ? { date } : undefined,
      }),
      providesTags: ["Appointments"],
    }),
    cancelAppointment: builder.mutation<{ appointment_id: string; status: string }, string>({
      query: (id) => ({
        url: `/v1/schedule/cancel/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Appointments"],
    }),
    updateAppointmentStatus: builder.mutation<
      { appointment: Appointment },
      { id: string; status: Appointment["status"] }
    >({
      query: ({ id, status }) => ({
        url: `/v1/schedule/appointments/${id}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Appointments"],
    }),
  }),
});

export const { useGetAppointmentsQuery, useCancelAppointmentMutation, useUpdateAppointmentStatusMutation } =
  appointmentsApi;
