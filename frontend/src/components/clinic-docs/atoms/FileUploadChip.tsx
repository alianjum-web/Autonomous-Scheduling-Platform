import { FileText, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface FileUploadChipProps {
  filename: string;
  sizeLabel?: string;
  onRemove?: () => void;
  className?: string;
}

export function FileUploadChip({ filename, sizeLabel, onRemove, className }: FileUploadChipProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-sm",
        className,
      )}
    >
      <FileText className="h-4 w-4 text-primary" />
      <span className="max-w-[200px] truncate">{filename}</span>
      {sizeLabel ? <span className="text-xs text-muted-foreground">{sizeLabel}</span> : null}
      {onRemove ? (
        <button type="button" onClick={onRemove} className="rounded-full p-0.5 hover:bg-muted">
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
