import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import { baseApi } from "@/components/common/store/baseApi";
import type { RootState } from "@/components/common/store";
import { readAccessToken } from "@/lib/supabase/accessToken";
import { isIngestUploadResponse } from "@/types/api";
import type { ClinicDocument, DocumentCategory, DocumentChunk, IngestionJob } from "@/types/clinic-docs";
import type {
  DeleteDocumentResponse,
  DocumentChunksResponse,
  DocumentListResponse,
  IngestUploadResponse,
} from "@/types/ingest";

export type { DocumentChunk };

export const clinicDocsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDocuments: builder.query<DocumentListResponse, void>({
      query: () => "/v1/ingest/documents",
      providesTags: ["Documents"],
    }),
    getDocumentChunks: builder.query<DocumentChunksResponse, string>({
      query: (documentId) => `/v1/ingest/documents/${documentId}/chunks`,
    }),
    deleteDocument: builder.mutation<DeleteDocumentResponse, string>({
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
      IngestUploadResponse,
      { file: File; category: DocumentCategory }
    >({
      queryFn: async ({ file, category }, api) => {
        const token = await readAccessToken(() => api.getState() as RootState);
        if (!token) {
          return {
            error: { status: 401, data: { detail: "Not authenticated" } } satisfies FetchBaseQueryError,
          };
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
          const err: unknown = await res.json().catch(() => ({ detail: res.statusText }));
          return { error: { status: res.status, data: err } satisfies FetchBaseQueryError };
        }

        const result: unknown = await res.json();
        if (!isIngestUploadResponse(result)) {
          return {
            error: {
              status: 502,
              data: { detail: "Invalid ingest response shape" },
            } satisfies FetchBaseQueryError,
          };
        }
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

export type { ClinicDocument, IngestionJob, IngestUploadResponse };
