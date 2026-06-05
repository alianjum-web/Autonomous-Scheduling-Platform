import { FileText, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ClinicDocument } from "@/store/clinicDocsSlice";

const CATEGORY_LABELS: Record<string, string> = {
  treatment_protocol: "Treatment Protocol",
  pricing: "Pricing",
  insurance: "Insurance",
  faq: "FAQ",
  other: "Other",
};

interface DocumentCardProps {
  document: ClinicDocument;
  selected?: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function DocumentCard({ document, selected, onSelect, onDelete }: DocumentCardProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
        selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      }`}
    >
      <button type="button" onClick={onSelect} className="flex flex-1 items-center gap-3 text-left">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <p className="font-medium">{document.source_filename}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary">{CATEGORY_LABELS[document.category] ?? document.category}</Badge>
            <span className="text-xs text-muted-foreground">{document.chunk_count} chunks</span>
          </div>
        </div>
      </button>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete document">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
