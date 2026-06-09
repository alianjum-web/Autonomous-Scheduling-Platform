import { baseApi } from "@/components/common/store/baseApi";
import type { Appointment } from "@/types/appointments";
import type {
  AppointmentsListResponse,
  CancelAppointmentResponse,
  UpdateAppointmentResponse,
  UpdateAppointmentStatusRequest,
} from "@/types/schedule";

export const appointmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAppointments: builder.query<AppointmentsListResponse, string | void>({
      query: (date) => ({
        url: "/v1/schedule/appointments",
        params: date ? { date } : undefined,
      }),
      providesTags: ["Appointments"],
    }),
    cancelAppointment: builder.mutation<CancelAppointmentResponse, string>({
      query: (id) => ({
        url: `/v1/schedule/cancel/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Appointments"],
    }),
    updateAppointmentStatus: builder.mutation<
      UpdateAppointmentResponse,
      UpdateAppointmentStatusRequest
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

export const {
  useGetAppointmentsQuery,
  useCancelAppointmentMutation,
  useUpdateAppointmentStatusMutation,
} = appointmentsApi;

export type { Appointment };
