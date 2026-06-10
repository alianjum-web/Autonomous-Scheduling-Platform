import { baseApi } from "@/components/common/store/baseApi";
import type {
  BookAppointmentRequest,
  BookAppointmentResponse,
  CalendarConfigResponse,
  CalendarConfigUpdateRequest,
  SlotsResponse,
} from "@/types/schedule";

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAvailableSlots: builder.query<SlotsResponse, void>({
      query: () => "/v1/schedule/slots",
      keepUnusedDataFor: 30,
    }),
    bookAppointment: builder.mutation<BookAppointmentResponse, BookAppointmentRequest>({
      query: (body) => ({
        url: "/v1/schedule/book",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Appointments"],
    }),
    getCalendarConfig: builder.query<CalendarConfigResponse, void>({
      query: () => "/v1/schedule/calendar-config",
      providesTags: ["Calendar"],
    }),
    updateCalendarConfig: builder.mutation<CalendarConfigResponse, CalendarConfigUpdateRequest>({
      query: (body) => ({
        url: "/v1/schedule/calendar-config",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Calendar", "Compliance"],
    }),
  }),
});

export const {
  useGetAvailableSlotsQuery,
  useBookAppointmentMutation,
  useGetCalendarConfigQuery,
  useUpdateCalendarConfigMutation,
} = bookingApi;
