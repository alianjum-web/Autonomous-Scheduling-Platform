import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type DocumentCategory =
  | "treatment_protocol"
  | "pricing"
  | "insurance"
  | "faq"
  | "other";

export type IngestionJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "partial";

export interface ClinicDocument {
  id: string;
  source_filename: string;
  category: DocumentCategory;
  file_hash: string;
  chunk_count: number;
  ingested_by: string;
  created_at: string;
}

export interface IngestionJob {
  id: string;
  filename: string;
  category: DocumentCategory;
  status: IngestionJobStatus;
  progress_pct: number;
  chunks_total: number;
  chunks_done: number;
  error_message?: string | null;
  document_id?: string | null;
}

export interface UploadProgress {
  jobId: string;
  filename: string;
  progress: number;
  status: IngestionJobStatus;
}

export interface ClinicDocsState {
  documents: ClinicDocument[];
  uploadProgress: UploadProgress | null;
  selectedDoc: ClinicDocument | null;
  ingestionJobs: IngestionJob[];
}

const initialState: ClinicDocsState = {
  documents: [],
  uploadProgress: null,
  selectedDoc: null,
  ingestionJobs: [],
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
  resetClinicDocs,
} = clinicDocsSlice.actions;

export default clinicDocsSlice.reducer;
