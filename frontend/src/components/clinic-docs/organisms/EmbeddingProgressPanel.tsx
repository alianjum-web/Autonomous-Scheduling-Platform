"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";

import { IngestionStatusDot } from "@/components/clinic-docs/atoms/IngestionStatusDot";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentIngestion } from "@/hooks/useDocumentIngestion";
import type { RootState } from "@/store";

interface EmbeddingProgressPanelProps {
  jobId: string | null;
}

export function EmbeddingProgressPanel({ jobId }: EmbeddingProgressPanelProps) {
  const { subscribeToJob } = useDocumentIngestion();
  const uploadProgress = useSelector((state: RootState) => state.clinicDocs.uploadProgress);

  useEffect(() => {
    if (!jobId) return;
    return subscribeToJob(jobId);
  }, [jobId, subscribeToJob]);

  if (!uploadProgress) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">No active ingestion jobs.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center gap-2">
        <IngestionStatusDot status={uploadProgress.status} />
        <span className="text-sm font-medium">{uploadProgress.filename}</span>
        <span className="ml-auto text-xs text-muted-foreground capitalize">
          {uploadProgress.status}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${uploadProgress.progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{uploadProgress.progress}% complete</p>
      {uploadProgress.status === "processing" && uploadProgress.progress < 10 ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ) : null}
    </div>
  );
}
