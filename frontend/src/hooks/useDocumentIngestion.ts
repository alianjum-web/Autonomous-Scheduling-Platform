"use client";

import { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";

import { createClient } from "@/lib/supabase/client";
import { useUploadDocumentMutation } from "@/store/api";
import {
  setUploadProgress,
  updateJobProgress,
  type DocumentCategory,
  type IngestionJob,
} from "@/store/clinicDocsSlice";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function useDocumentIngestion() {
  const dispatch = useDispatch();
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation();

  const validateFile = useCallback((file: File): string | null => {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
      return "Only PDF and DOCX files are accepted.";
    }
    if (file.size > MAX_FILE_BYTES) {
      return "File exceeds the 50MB limit. Please upload a smaller document.";
    }
    if (file.type && !ALLOWED_TYPES.includes(file.type) && !lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
      return "Invalid file type.";
    }
    return null;
  }, []);

  const subscribeToJob = useCallback(
    (jobId: string) => {
      const supabase = createClient();
      const channel = supabase
        .channel(`ingestion:${jobId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "ingestion_jobs",
            filter: `id=eq.${jobId}`,
          },
          (payload) => {
            dispatch(updateJobProgress(payload.new as IngestionJob));
            const job = payload.new as IngestionJob;
            if (["completed", "failed", "partial"].includes(job.status)) {
              dispatch(
                setUploadProgress({
                  jobId: job.id,
                  filename: job.filename,
                  progress: job.progress_pct,
                  status: job.status,
                }),
              );
            }
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    [dispatch],
  );

  const ingest = useCallback(
    async (file: File, category: DocumentCategory) => {
      const error = validateFile(file);
      if (error) throw new Error(error);

      dispatch(
        setUploadProgress({
          jobId: "",
          filename: file.name,
          progress: 0,
          status: "pending",
        }),
      );

      const result = await uploadDocument({ file, category }).unwrap();
      dispatch(
        setUploadProgress({
          jobId: result.job_id,
          filename: result.filename,
          progress: 0,
          status: "processing",
        }),
      );
      return result;
    },
    [dispatch, uploadDocument, validateFile],
  );

  return { ingest, validateFile, subscribeToJob, isUploading: isLoading };
}
