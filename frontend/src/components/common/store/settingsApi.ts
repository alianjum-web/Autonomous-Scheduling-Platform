import { fetchUserProfile } from "@/lib/supabase/onboarding";

import { baseApi } from "./baseApi";
import type { BAAAcknowledgeResponse, BAAStatusResponse } from "@/types/compliance";
import type { ProfileTenantEmbed } from "@/types/supabase-profile";
import type { UserProfileSummary } from "@/types/settings";

export type { BAAStatusResponse, UserProfileSummary };

function resolveTenantEmbed(
  tenants: ProfileTenantEmbed | ProfileTenantEmbed[] | null | undefined,
): ProfileTenantEmbed | null {
  if (!tenants) return null;
  return Array.isArray(tenants) ? (tenants[0] ?? null) : tenants;
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

        const tenant = resolveTenantEmbed(data.profile?.tenants);
        return {
          data: {
            clinicName: tenant?.name ?? null,
            workspaceSlug: tenant?.slug ?? null,
            email: data.user.email ?? null,
            fullName: data.profile?.full_name ?? null,
            role: data.profile?.role ?? null,
          },
        };
      },
      providesTags: ["Profile"],
    }),
    getBAAStatus: builder.query<BAAStatusResponse, void>({
      query: () => "/v1/compliance/baa/status",
      providesTags: ["Compliance"],
      // All signed-in users need BAA status (patients see block message; admins can fix it).
    }),
    acknowledgeBAA: builder.mutation<BAAAcknowledgeResponse, void>({
      query: () => ({
        url: "/v1/compliance/baa/acknowledge",
        method: "POST",
      }),
      invalidatesTags: ["Compliance"],
    }),
  }),
});

export const { useGetUserProfileQuery, useGetBAAStatusQuery, useAcknowledgeBAAMutation } =
  settingsApi;
