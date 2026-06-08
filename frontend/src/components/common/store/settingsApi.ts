import { fetchUserProfile } from "@/lib/supabase/onboarding";

import { baseApi } from "./baseApi";

export interface UserProfileSummary {
  clinicName: string | null;
  workspaceSlug: string | null;
  email: string | null;
  fullName: string | null;
  role: string | null;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query<UserProfileSummary, void>({
      queryFn: async () => {
        const data = await fetchUserProfile();
        if (!data) {
          return {
            data: {
              clinicName: null,
              workspaceSlug: null,
              email: null,
              fullName: null,
              role: null,
            },
          };
        }

        const tenant = data.profile?.tenants as { name?: string; slug?: string } | null;
        return {
          data: {
            clinicName: tenant?.name ?? null,
            workspaceSlug: tenant?.slug ?? null,
            email: data.user.email ?? null,
            fullName: data.profile?.full_name ?? null,
            role: (data.profile?.role as string | null) ?? null,
          },
        };
      },
      providesTags: ["Profile"],
    }),
  }),
});

export const { useGetUserProfileQuery } = settingsApi;
