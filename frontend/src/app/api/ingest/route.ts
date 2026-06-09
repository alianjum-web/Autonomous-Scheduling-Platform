import { NextRequest, NextResponse } from "next/server";

import type { ApiErrorBody } from "@/types/api";
import { isApiErrorBody, isIngestUploadResponse } from "@/types/api";
import type { IngestUploadResponse } from "@/types/ingest";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const MAX_FILE_BYTES = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const category = formData.get("category");

  if (!(file instanceof File)) {
    return NextResponse.json({ detail: "No file provided" }, { status: 400 });
  }

  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
    return NextResponse.json(
      { detail: "Only PDF and DOCX files are accepted" },
      { status: 415 },
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      {
        detail: "File exceeds maximum size of 50MB",
        max_bytes: MAX_FILE_BYTES,
        guidance: "Compress or split the document before uploading.",
      },
      { status: 413 },
    );
  }

  const upstream = new FormData();
  upstream.append("file", file);
  upstream.append("category", String(category ?? "other"));

  const res = await fetch(`${API_BASE}/v1/ingest/document`, {
    method: "POST",
    headers: { Authorization: authHeader },
    body: upstream,
  });

  const body: unknown = await res.json().catch(() => ({ detail: res.statusText }));
  if (res.ok) {
    if (!isIngestUploadResponse(body)) {
      return NextResponse.json({ detail: "Invalid upstream response" }, { status: 502 });
    }
    return NextResponse.json(body satisfies IngestUploadResponse, { status: res.status });
  }
  const error: ApiErrorBody = isApiErrorBody(body)
    ? body
    : { detail: res.statusText };
  return NextResponse.json(error, { status: res.status });
}
