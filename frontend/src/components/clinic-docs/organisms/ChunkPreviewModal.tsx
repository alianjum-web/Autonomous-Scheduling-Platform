"use client";

import { Modal } from "@/components/common/molecules/Modal";
import { ChunkPreviewRow } from "@/components/clinic-docs/molecules/ChunkPreviewRow";
import { useGetDocumentChunksQuery } from "@/components/clinic-docs/store/clinicDocsApi";
import type { ClinicDocument } from "@/types/clinic-docs";

interface ChunkPreviewModalProps {
  document: ClinicDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChunkPreviewModal({ document, open, onOpenChange }: ChunkPreviewModalProps) {
  const { data, isLoading } = useGetDocumentChunksQuery(document?.id ?? "", {
    skip: !document?.id || !open,
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={document ? `Chunks: ${document.source_filename}` : "Chunk Preview"}
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading chunks…</p>
      ) : (
        <div className="max-h-96 space-y-3 overflow-y-auto">
          {(data?.chunks ?? []).map((chunk, i) => (
            <ChunkPreviewRow key={chunk.id} chunk={chunk} index={i} />
          ))}
          {!data?.chunks?.length ? (
            <p className="text-sm text-muted-foreground">No chunks available.</p>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
