"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { IngestionStatusDot } from "@/components/clinic-docs/atoms/IngestionStatusDot";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDocumentIngestion } from "@/components/clinic-docs/hooks/useDocumentIngestion";
import { selectUploadProgress } from "@/components/clinic-docs/store/clinicDocsSelectors";
import { useAppSelector } from "@/components/common/store/hooks";

interface EmbeddingProgressPanelProps {
  jobId: string | null;
}

export function EmbeddingProgressPanel({ jobId }: EmbeddingProgressPanelProps) {
  const { subscribeToJob } = useDocumentIngestion();
  const uploadProgress = useAppSelector(selectUploadProgress);

  useEffect(() => {
    if (!jobId) return;
    return subscribeToJob(jobId);
  }, [jobId, subscribeToJob]);

  if (!uploadProgress) {
    return (
      <Card className="h-full border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ingestion status</CardTitle>
          <CardDescription>Progress appears here after you start an upload.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <Loader2 className="size-8 text-muted-foreground/40" aria-hidden />
          <p className="text-sm text-muted-foreground">No active ingestion jobs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Ingestion status</CardTitle>
        <CardDescription>Embedding document chunks for AI triage</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
