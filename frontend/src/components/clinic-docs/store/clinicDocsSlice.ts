import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type {
  ClinicDocument,
  DocumentCategory,
  IngestionJob,
  IngestionJobStatus,
  UploadFormState,
  UploadProgress,
} from "@/types/clinic-docs";

export type {
  ClinicDocument,
  DocumentCategory,
  IngestionJob,
  IngestionJobStatus,
  UploadFormState,
  UploadProgress,
};

export interface ClinicDocsUiState {
  activeJobId: string | null;
  previewOpen: boolean;
}

export interface ClinicDocsState {
  documents: ClinicDocument[];
  uploadProgress: UploadProgress | null;
  selectedDoc: ClinicDocument | null;
  ingestionJobs: IngestionJob[];
  uploadForm: UploadFormState;
  ui: ClinicDocsUiState;
}

const initialState: ClinicDocsState = {
  documents: [],
  uploadProgress: null,
  selectedDoc: null,
  ingestionJobs: [],
  uploadForm: {
    category: "faq",
    pendingFileName: null,
    pendingFileSize: null,
    dragOver: false,
    error: null,
  },
  ui: {
    activeJobId: null,
    previewOpen: false,
  },
};

const clinicDocsSlice = createSlice({
  name: "clinicDocs",
  initialState,
  reducers: {
    setDocuments(state, action: PayloadAction<ClinicDocument[]>) {
      state.documents = action.payload;
    },
    setSelectedDoc(state, action: PayloadAction<ClinicDocument | null>) {
      state.selectedDoc = action.payload;
    },
    setUploadProgress(state, action: PayloadAction<UploadProgress | null>) {
      state.uploadProgress = action.payload;
    },
    updateJobProgress(state, action: PayloadAction<IngestionJob>) {
      const job = action.payload;
      const idx = state.ingestionJobs.findIndex((j) => j.id === job.id);
      if (idx >= 0) {
        state.ingestionJobs[idx] = job;
      } else {
        state.ingestionJobs.push(job);
      }
      if (state.uploadProgress?.jobId === job.id) {
        state.uploadProgress = {
          jobId: job.id,
          filename: job.filename,
          progress: job.progress_pct,
          status: job.status,
        };
      }
    },
    removeDocument(state, action: PayloadAction<string>) {
      state.documents = state.documents.filter((d) => d.id !== action.payload);
      if (state.selectedDoc?.id === action.payload) {
        state.selectedDoc = null;
      }
    },
    setUploadCategory(state, action: PayloadAction<DocumentCategory>) {
      state.uploadForm.category = action.payload;
    },
    setPendingFileMeta(
      state,
      action: PayloadAction<{ name: string; size: number } | null>,
    ) {
      if (action.payload) {
        state.uploadForm.pendingFileName = action.payload.name;
        state.uploadForm.pendingFileSize = action.payload.size;
        state.uploadForm.error = null;
      } else {
        state.uploadForm.pendingFileName = null;
        state.uploadForm.pendingFileSize = null;
      }
    },
    setUploadDragOver(state, action: PayloadAction<boolean>) {
      state.uploadForm.dragOver = action.payload;
    },
    setUploadError(state, action: PayloadAction<string | null>) {
      state.uploadForm.error = action.payload;
    },
    setActiveJobId(state, action: PayloadAction<string | null>) {
      state.ui.activeJobId = action.payload;
    },
    setPreviewOpen(state, action: PayloadAction<boolean>) {
      state.ui.previewOpen = action.payload;
    },
    resetClinicDocs() {
      return initialState;
    },
  },
});

export const {
  setDocuments,
  setSelectedDoc,
  setUploadProgress,
  updateJobProgress,
  removeDocument,
  setUploadCategory,
  setPendingFileMeta,
  setUploadDragOver,
  setUploadError,
  setActiveJobId,
  setPreviewOpen,
  resetClinicDocs,
} = clinicDocsSlice.actions;

export default clinicDocsSlice.reducer;
