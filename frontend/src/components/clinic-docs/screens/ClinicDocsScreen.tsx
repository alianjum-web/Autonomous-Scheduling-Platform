"use client";

import { useEffect } from "react";
import { FileSearch } from "lucide-react";

import { useAdminGuard } from "@/components/common/hooks/useAdminGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { PageShell } from "@/components/common/layout/PageShell";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { BAAComplianceBanner } from "@/components/common/molecules/BAAComplianceBanner";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { useGetBAAStatusQuery } from "@/components/common/store/settingsApi";
import { useAppDispatch, useAppSelector } from "@/components/common/store/hooks";
import {
  selectClinicDocsUi,
  selectDocuments,
  selectSelectedDoc,
} from "@/components/clinic-docs/store/clinicDocsSelectors";
import { DocumentCard } from "@/components/clinic-docs/molecules/DocumentCard";
import { ChunkPreviewModal } from "@/components/clinic-docs/organisms/ChunkPreviewModal";
import { DocumentUploader } from "@/components/clinic-docs/organisms/DocumentUploader";
import { EmbeddingProgressPanel } from "@/components/clinic-docs/organisms/EmbeddingProgressPanel";
import {
  useDeleteDocumentMutation,
  useGetDocumentsQuery,
} from "@/components/clinic-docs/store/clinicDocsApi";
import {
  removeDocument,
  setActiveJobId,
  setDocuments,
  setPreviewOpen,
  setSelectedDoc,
} from "@/components/clinic-docs/store/clinicDocsSlice";

export function ClinicDocsScreen() {
  const dispatch = useAppDispatch();
  const { loading: authLoading, isAdmin } = useAdminGuard();
  const { session } = useAuthSession();
  const { data, isLoading, refetch } = useGetDocumentsQuery(undefined, { skip: !isAdmin });
  const [deleteDocument] = useDeleteDocumentMutation();

  const documents = useAppSelector(selectDocuments);
  const selectedDoc = useAppSelector(selectSelectedDoc);
  const ui = useAppSelector(selectClinicDocsUi);
  const { data: baa } = useGetBAAStatusQuery(undefined, { skip: !isAdmin });
  const docsBlocked = Boolean(baa && !baa.ai_features_available);

  useEffect(() => {
    if (data?.documents) {
      dispatch(setDocuments(data.documents));
    }
  }, [data, dispatch]);

  if (authLoading) return <LoadingScreen message="Checking permissions…" />;

  if (!session) {
    return (
      <AccessGate
        title="Sign in to manage documents"
        description="Clinic document ingestion and RAG embedding require an authenticated admin session."
        icon={<FileSearch className="size-8" />}
        imageKey="docs"
        requireAdmin
      />
    );
  }

  if (!isAdmin) {
    return (
      <AccessGate
        title="Admin access required"
        description="You're signed in, but only clinic administrators can upload and manage knowledge base documents."
        icon={<FileSearch className="size-8" />}
        imageKey="docs"
        requireAdmin
        signedIn
      />
    );
  }

  return (
    <PageShell maxWidth="4xl" className="gap-8">
      <PageHeader
        eyebrow="Knowledge base"
        title="Clinic Documents"
        description="Upload treatment protocols, pricing guides, insurance policies, and FAQs for RAG-powered patient intake."
        imageKey="docs"
      />

      <BAAComplianceBanner context="docs" />

      <section className="grid gap-6 md:grid-cols-2">
        <DocumentUploader
          disabled={docsBlocked}
          onUploaded={(jobId) => {
            dispatch(setActiveJobId(jobId));
            refetch();
          }}
        />
        <EmbeddingProgressPanel jobId={ui.activeJobId} />
      </section>

      <section className="hero-glow rounded-2xl border border-border/80 bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Ingested Documents</h2>
        {isLoading ? (
          <LoadingScreen message="Loading documents…" />
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No documents ingested yet. Upload your first clinic policy above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                selected={selectedDoc?.id === doc.id}
                onSelect={() => {
                  dispatch(setSelectedDoc(doc));
                  dispatch(setPreviewOpen(true));
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
        open={ui.previewOpen}
        onOpenChange={(open) => dispatch(setPreviewOpen(open))}
      />
    </PageShell>
  );
}
