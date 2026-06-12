import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";

import { selectAccessToken } from "@/components/auth/store/authSelectors";
import { setSession } from "@/components/auth/store/authSlice";
import type { RootState } from "@/components/common/store";
import { createClient } from "@/lib/supabase/client";
import { refreshAuthSessionOnce } from "@/lib/supabase/sessionRefresh";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Typed RTK Query base query — endpoint handlers specify concrete response types. */
export type ApiBaseQuery = BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers, { getState }) => {
    const token = selectAccessToken(getState() as RootState);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: ApiBaseQuery = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  // Refresh only on 401 — 403 is a role/permission issue, not an expired token.
  // Refreshing on 403 caused session churn for clinic_admin hitting owner-only APIs.
  if (result.error?.status === 401) {
    const supabase = createClient();
    const session = await refreshAuthSessionOnce(supabase);
    if (session) {
      api.dispatch(setSession(session));
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Documents", "IngestionJob", "Appointments", "Profile", "Compliance", "Calendar", "StaffInvites", "Doctors"],
  endpoints: () => ({}),
});
