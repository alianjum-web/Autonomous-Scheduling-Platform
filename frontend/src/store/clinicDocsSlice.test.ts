import { describe, expect, it } from "vitest";

import clinicDocsReducer, {
  removeDocument,
  setDocuments,
  setSelectedDoc,
  setUploadProgress,
  updateJobProgress,
  type ClinicDocument,
  type IngestionJob,
} from "./clinicDocsSlice";

const sampleDoc: ClinicDocument = {
  id: "doc-1",
  source_filename: "pricing.pdf",
  category: "pricing",
  file_hash: "abc",
  chunk_count: 10,
  ingested_by: "user-1",
  created_at: "2026-01-01",
};

const sampleJob: IngestionJob = {
  id: "job-1",
  filename: "pricing.pdf",
  category: "pricing",
  status: "processing",
  progress_pct: 45,
  chunks_total: 10,
  chunks_done: 4,
};

describe("clinicDocsSlice", () => {
  it("sets documents list", () => {
    const state = clinicDocsReducer(undefined, setDocuments([sampleDoc]));
    expect(state.documents).toHaveLength(1);
  });

  it("tracks upload progress", () => {
    const state = clinicDocsReducer(
      undefined,
      setUploadProgress({ jobId: "job-1", filename: "a.pdf", progress: 0, status: "pending" }),
    );
    expect(state.uploadProgress?.jobId).toBe("job-1");
  });

  it("updates ingestion job progress", () => {
    let state = clinicDocsReducer(undefined, setUploadProgress({
      jobId: "job-1", filename: "a.pdf", progress: 0, status: "processing",
    }));
    state = clinicDocsReducer(state, updateJobProgress(sampleJob));
    expect(state.uploadProgress?.progress).toBe(45);
    expect(state.ingestionJobs).toHaveLength(1);
  });

  it("removes document and clears selection", () => {
    let state = clinicDocsReducer(undefined, setDocuments([sampleDoc]));
    state = clinicDocsReducer(state, setSelectedDoc(sampleDoc));
    state = clinicDocsReducer(state, removeDocument("doc-1"));
    expect(state.documents).toHaveLength(0);
    expect(state.selectedDoc).toBeNull();
  });
});
