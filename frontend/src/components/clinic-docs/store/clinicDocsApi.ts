import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import { baseApi } from "@/components/common/store/baseApi";
import { createClient } from "@/lib/supabase/client";
import type { ClinicDocument, DocumentCategory, DocumentChunk, IngestionJob } from "@/types/clinic-docs";

export type { DocumentChunk };

export const clinicDocsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDocuments: builder.query<{ documents: ClinicDocument[] }, void>({
      query: () => "/v1/ingest/documents",
      providesTags: ["Documents"],
    }),
    getDocumentChunks: builder.query<{ chunks: DocumentChunk[] }, string>({
      query: (documentId) => `/v1/ingest/documents/${documentId}/chunks`,
    }),
    deleteDocument: builder.mutation<{ deleted: string }, string>({
      query: (documentId) => ({
        url: `/v1/ingest/document/${documentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Documents"],
    }),
    getIngestionStatus: builder.query<IngestionJob, string>({
      query: (jobId) => `/v1/ingest/status/${jobId}`,
      providesTags: (_result, _err, jobId) => [{ type: "IngestionJob", id: jobId }],
    }),
    uploadDocument: builder.mutation<
      { job_id: string; status: string; filename: string },
      { file: File; category: DocumentCategory }
    >({
      queryFn: async ({ file, category }) => {
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          return { error: { status: 401, data: { detail: "Not authenticated" } } as FetchBaseQueryError };
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);

        const res = await fetch("/api/ingest", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: res.statusText }));
          return { error: { status: res.status, data: err } as FetchBaseQueryError };
        }

        const result = (await res.json()) as { job_id: string; status: string; filename: string };
        return { data: result };
      },
      invalidatesTags: ["Documents"],
    }),
  }),
});

export const {
  useGetDocumentsQuery,
  useGetDocumentChunksQuery,
  useDeleteDocumentMutation,
  useGetIngestionStatusQuery,
  useUploadDocumentMutation,
} = clinicDocsApi;
