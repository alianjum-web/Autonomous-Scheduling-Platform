"use client";

import { useEffect } from "react";
import { FileSearch } from "lucide-react";

import {
  selectAuthLoading,
  selectAuthProfileReady,
  selectIsOwner,
} from "@/components/auth/store/authSelectors";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { PageShell } from "@/components/common/layout/PageShell";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { BAAComplianceBanner } from "@/components/common/molecules/BAAComplianceBanner";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { useGetBAAStatusQuery } from "@/components/common/store/settingsApi";
import { useAppDispatch, useAppSelector } from "@/components/common/store/hooks";
import { ClinicDocsQuickTips } from "@/components/clinic-docs/molecules/ClinicDocsQuickTips";
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
  const { session } = useAuthSession();
  const authLoading = useAppSelector(selectAuthLoading);
  const profileReady = useAppSelector(selectAuthProfileReady);
  const isOwner = useAppSelector(selectIsOwner);
  const { data, isLoading, refetch } = useGetDocumentsQuery(undefined, { skip: !isOwner });
  const [deleteDocument] = useDeleteDocumentMutation();

  const documents = useAppSelector(selectDocuments);
  const selectedDoc = useAppSelector(selectSelectedDoc);
  const ui = useAppSelector(selectClinicDocsUi);
  const { data: baa } = useGetBAAStatusQuery(undefined, { skip: !isOwner });
  const docsBlocked = Boolean(baa && !baa.ai_features_available);

  useEffect(() => {
    if (data?.documents) {
      dispatch(setDocuments(data.documents));
    }
  }, [data, dispatch]);

  if (authLoading || (session && !profileReady)) {
    return <LoadingScreen message="Checking permissions…" />;
  }

  if (!session) {
    return (
      <AccessGate
        title="Sign in to manage documents"
        description="Clinic document ingestion and RAG embedding require a signed-in clinic owner."
        icon={<FileSearch className="size-8" />}
        imageKey="docs"
        requireAdmin
      />
    );
  }

  if (!isOwner) {
    return (
      <AccessGate
        title="Clinic owner access required"
        description="Only the clinic owner can upload and manage the knowledge base. Staff and doctors can view AI answers in patient triage."
        icon={<FileSearch className="size-8" />}
        imageKey="docs"
        requireAdmin
        signedIn
      />
    );
  }

  return (
    <PageShell maxWidth="5xl" className="gap-8 pb-12">
      <PageHeader
        eyebrow="Knowledge base"
        title="Clinic Documents"
        description="Upload treatment protocols, pricing guides, insurance policies, and FAQs. The patient intake assistant uses these files to answer questions about hours, services, and clinic policies."
        imageKey="docs"
      />

      <BAAComplianceBanner context="docs" />
      <ClinicDocsQuickTips />

      <section className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <DocumentUploader
          disabled={docsBlocked}
          onUploaded={(jobId) => {
            dispatch(setActiveJobId(jobId));
            void refetch();
          }}
        />
        <EmbeddingProgressPanel jobId={ui.activeJobId} />
      </section>

      <section className="hero-glow rounded-2xl border border-border/80 bg-card p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Ingested documents</h2>
            <p className="text-sm text-muted-foreground">
              {documents.length === 0
                ? "No files yet — upload your first FAQ or policy document above."
                : `${documents.length} document${documents.length === 1 ? "" : "s"} available to AI triage`}
            </p>
          </div>
        </div>
        {isLoading ? (
          <LoadingScreen message="Loading documents…" />
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <FileSearch className="mx-auto mb-3 size-10 text-muted-foreground/50" aria-hidden />
            <p className="text-sm font-medium">No documents ingested yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Start with an FAQ PDF, or add quick facts under Settings → Public booking page → AI
              intake assistant knowledge.
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
