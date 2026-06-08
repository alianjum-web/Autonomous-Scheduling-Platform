"use client";

import { useCallback, useRef } from "react";
import { useAppDispatch } from "@/components/common/store/hooks";

import { useUploadDocumentMutation } from "@/components/clinic-docs/store/clinicDocsApi";
import {
  setPendingFileMeta,
  setUploadError,
  setUploadProgress,
  updateJobProgress,
  type DocumentCategory,
  type IngestionJob,
} from "@/components/clinic-docs/store/clinicDocsSlice";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function useDocumentIngestion() {
  const dispatch = useAppDispatch();
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation();
  const pendingFileRef = useRef<File | null>(null);

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

  const stageFile = useCallback(
    (file: File | null) => {
      if (!file) {
        pendingFileRef.current = null;
        dispatch(setPendingFileMeta(null));
        return null;
      }
      const validationError = validateFile(file);
      if (validationError) {
        pendingFileRef.current = null;
        dispatch(setPendingFileMeta(null));
        dispatch(setUploadError(validationError));
        return validationError;
      }
      pendingFileRef.current = file;
      dispatch(setPendingFileMeta({ name: file.name, size: file.size }));
      dispatch(setUploadError(null));
      return null;
    },
    [dispatch, validateFile],
  );

  const clearStagedFile = useCallback(() => {
    pendingFileRef.current = null;
    dispatch(setPendingFileMeta(null));
  }, [dispatch]);

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
    async (category: DocumentCategory) => {
      const file = pendingFileRef.current;
      if (!file) throw new Error("No file selected.");

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
      pendingFileRef.current = null;
      dispatch(setPendingFileMeta(null));
      return result;
    },
    [dispatch, uploadDocument],
  );

  return {
    ingest,
    validateFile,
    stageFile,
    clearStagedFile,
    subscribeToJob,
    isUploading: isLoading,
  };
}
