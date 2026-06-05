"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FileUploadChip } from "@/components/clinic-docs/atoms/FileUploadChip";
import { useDocumentIngestion } from "@/hooks/useDocumentIngestion";
import { cn } from "@/lib/utils";
import type { DocumentCategory } from "@/store/clinicDocsSlice";

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

interface DocumentUploaderProps {
  onUploaded?: (jobId: string) => void;
}

export function DocumentUploader({ onUploaded }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("faq");
  const [error, setError] = useState<string | null>(null);
  const { ingest, validateFile, isUploading } = useDocumentIngestion();

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setSelectedFile(file);
    },
    [validateFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFile(e.dataTransfer.files[0] ?? null);
    },
    [handleFile],
  );

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      const result = await ingest(selectedFile, category);
      onUploaded?.(result.job_id);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">Drag & drop PDF or DOCX here</p>
        <p className="mt-1 text-xs text-muted-foreground">Max 50MB per file</p>
        <Button
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

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              category === c.value
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {selectedFile ? (
        <div className="flex items-center justify-between">
          <FileUploadChip
            filename={selectedFile.name}
            sizeLabel={formatBytes(selectedFile.size)}
            onRemove={() => setSelectedFile(null)}
          />
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? "Uploading…" : "Start Ingestion"}
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
