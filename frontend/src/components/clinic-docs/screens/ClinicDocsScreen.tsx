"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DocumentCard } from "@/components/clinic-docs/molecules/DocumentCard";
import { ChunkPreviewModal } from "@/components/clinic-docs/organisms/ChunkPreviewModal";
import { DocumentUploader } from "@/components/clinic-docs/organisms/DocumentUploader";
import { EmbeddingProgressPanel } from "@/components/clinic-docs/organisms/EmbeddingProgressPanel";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import {
  useDeleteDocumentMutation,
  useGetDocumentsQuery,
} from "@/store/api";
import { removeDocument, setDocuments, setSelectedDoc } from "@/store/clinicDocsSlice";
import type { RootState } from "@/store";

export function ClinicDocsScreen() {
  const dispatch = useDispatch();
  const { loading: authLoading, isAdmin } = useAdminGuard();
  const { data, isLoading, refetch } = useGetDocumentsQuery(undefined, { skip: !isAdmin });
  const [deleteDocument] = useDeleteDocumentMutation();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const documents = useSelector((state: RootState) => state.clinicDocs.documents);
  const selectedDoc = useSelector((state: RootState) => state.clinicDocs.selectedDoc);

  useEffect(() => {
    if (data?.documents) {
      dispatch(setDocuments(data.documents));
    }
  }, [data, dispatch]);

  if (authLoading) {
    return <p className="p-8 text-muted-foreground">Checking permissions…</p>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <h2 className="text-lg font-semibold">Admin access required</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Only clinic administrators can manage document ingestion.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold">Clinic Documents</h1>
        <p className="text-sm text-muted-foreground">
          Upload treatment protocols, pricing guides, insurance policies, and FAQs for RAG-powered
          patient intake.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <DocumentUploader
          onUploaded={(jobId) => {
            setActiveJobId(jobId);
            refetch();
          }}
        />
        <EmbeddingProgressPanel jobId={activeJobId} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Ingested Documents</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading documents…</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents ingested yet.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                selected={selectedDoc?.id === doc.id}
                onSelect={() => {
                  dispatch(setSelectedDoc(doc));
                  setPreviewOpen(true);
                }}
                onDelete={async () => {
                  await deleteDocument(doc.id);
                  dispatch(removeDocument(doc.id));
                }}
              />
            ))}
          </div>
        )}
      </section>

      <ChunkPreviewModal
        document={selectedDoc}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
