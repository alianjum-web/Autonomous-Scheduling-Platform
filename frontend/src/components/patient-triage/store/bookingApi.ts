import { baseApi } from "@/components/common/store/baseApi";
import type {
  BookAppointmentRequest,
  BookAppointmentResponse,
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
  }),
});

export const { useGetAvailableSlotsQuery, useBookAppointmentMutation } = bookingApi;
