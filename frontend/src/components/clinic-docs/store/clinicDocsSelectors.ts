import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "@/components/common/store";

export const selectClinicDocsState = (state: RootState) => state.clinicDocs;

export const selectDocuments = (state: RootState) => state.clinicDocs.documents;
export const selectSelectedDoc = (state: RootState) => state.clinicDocs.selectedDoc;
export const selectUploadProgress = (state: RootState) => state.clinicDocs.uploadProgress;
export const selectUploadForm = (state: RootState) => state.clinicDocs.uploadForm;
export const selectClinicDocsUi = (state: RootState) => state.clinicDocs.ui;
export const selectIngestionJobs = (state: RootState) => state.clinicDocs.ingestionJobs;

export const selectActiveUpload = createSelector(
  [selectUploadProgress],
  (progress) => progress !== null,
);

export const selectDocumentsByCategory = (category: string) =>
  createSelector([selectDocuments], (documents) =>
    documents.filter((doc) => doc.category === category),
  );
