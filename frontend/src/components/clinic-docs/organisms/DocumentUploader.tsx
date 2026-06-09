"use client";

import { useCallback, useMemo, useRef } from "react";
import { Upload } from "lucide-react";

import { useReduxForm } from "@/components/common/hooks/useReduxForm";
import { useAppDispatch, useAppSelector } from "@/components/common/store/hooks";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { FileUploadChip } from "@/components/clinic-docs/atoms/FileUploadChip";
import { useDocumentIngestion } from "@/components/clinic-docs/hooks/useDocumentIngestion";
import { selectUploadForm } from "@/components/clinic-docs/store/clinicDocsSelectors";
import {
  setUploadCategory,
  setUploadDragOver,
  setUploadError,
  type DocumentCategory,
} from "@/components/clinic-docs/store/clinicDocsSlice";
import { cn } from "@/lib/utils";

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: "treatment_protocol", label: "Treatment Protocol" },
  { value: "pricing", label: "Pricing Guide" },
  { value: "insurance", label: "Insurance Policy" },
  { value: "faq", label: "FAQ" },
  { value: "other", label: "Other" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadFormValues {
  category: DocumentCategory;
}

interface DocumentUploaderProps {
  onUploaded?: (jobId: string) => void;
}

export function DocumentUploader({ onUploaded }: DocumentUploaderProps) {
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadForm = useAppSelector(selectUploadForm);
  const { ingest, stageFile, clearStagedFile, isUploading } = useDocumentIngestion();

  const formValues = useMemo(() => ({ category: uploadForm.category }), [uploadForm.category]);
  const form = useReduxForm<UploadFormValues>(formValues);

  const handleFile = useCallback(
    (file: File | null) => {
      stageFile(file);
    },
    [stageFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dispatch(setUploadDragOver(false));
      handleFile(e.dataTransfer.files[0] ?? null);
    },
    [dispatch, handleFile],
  );

  const onSubmit = form.handleSubmit(async ({ category }) => {
    try {
      const result = await ingest(category);
      onUploaded?.(result.job_id);
    } catch (err) {
      dispatch(
        setUploadError(err instanceof Error ? err.message : "Upload failed"),
      );
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            dispatch(setUploadDragOver(true));
          }}
          onDragLeave={() => dispatch(setUploadDragOver(false))}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
            uploadForm.dragOver ? "border-primary bg-primary/5" : "border-border",
          )}
        >
          <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">Drag & drop PDF or DOCX here</p>
          <p className="mt-1 text-xs text-muted-foreground">Max 50MB per file</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => inputRef.current?.click()}
          >
            Browse files
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      field.onChange(c.value);
                      dispatch(setUploadCategory(c.value));
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      field.value === c.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <FormControl>
                <input type="hidden" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {uploadForm.pendingFileName && uploadForm.pendingFileSize ? (
          <div className="flex items-center justify-between">
            <FileUploadChip
              filename={uploadForm.pendingFileName}
              sizeLabel={formatBytes(uploadForm.pendingFileSize)}
              onRemove={() => clearStagedFile()}
            />
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploading…" : "Start Ingestion"}
            </Button>
          </div>
        ) : null}

        {uploadForm.error ? (
          <p className="text-sm text-destructive">{uploadForm.error}</p>
        ) : null}
      </form>
    </Form>
  );
}
