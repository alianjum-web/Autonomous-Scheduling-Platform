import { fetchUserProfile } from "@/lib/supabase/profile";

import { baseApi } from "./baseApi";
import type {
  BAAAcknowledgeResponse,
  BAAStatusResponse,
  ComplianceReportResponse,
} from "@/types/compliance";
import type { ProfileTenantEmbed } from "@/types/supabase-profile";
import type { UserProfileSummary } from "@/types/settings";

export type { BAAStatusResponse, UserProfileSummary };

function resolveTenantEmbed(
  tenants: ProfileTenantEmbed | ProfileTenantEmbed[] | null | undefined,
): ProfileTenantEmbed | null {
  if (!tenants) return null;
  return Array.isArray(tenants) ? (tenants[0] ?? null) : tenants;
}

interface WorkspaceApiResponse {
  name: string;
  slug: string;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query<UserProfileSummary, void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
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
        let clinicName = tenant?.name ?? null;
        let workspaceSlug = tenant?.slug ?? null;

        // Supabase RLS hides the tenants embed until tenant_id is in the JWT — use the API.
        if (data.profile?.tenant_id && (!clinicName || !workspaceSlug)) {
          const workspace = await baseQuery("/v1/settings/workspace");
          if (workspace.data) {
            const ws = workspace.data as WorkspaceApiResponse;
            clinicName = clinicName ?? ws.name ?? null;
            workspaceSlug = workspaceSlug ?? ws.slug ?? null;
          }
        }

        return {
          data: {
            clinicName,
            workspaceSlug,
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
    getComplianceReport: builder.query<ComplianceReportResponse, void>({
      query: () => "/v1/compliance/report",
      providesTags: ["Compliance"],
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useGetBAAStatusQuery,
  useAcknowledgeBAAMutation,
  useGetComplianceReportQuery,
} = settingsApi;
