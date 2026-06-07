-- Sprint 2: Clinic document ingestion & RAG (pgvector)

CREATE EXTENSION IF NOT EXISTS vector;

-- Document metadata (one row per uploaded file)
CREATE TABLE clinic_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_filename TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('treatment_protocol', 'pricing', 'insurance', 'faq', 'other')),
    file_hash TEXT NOT NULL,
    chunk_count INT NOT NULL DEFAULT 0,
    ingested_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, file_hash)
);

-- Chunked + embedded protocol content
CREATE TABLE clinic_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES clinic_documents(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_filename TEXT NOT NULL,
    category TEXT NOT NULL,
    content_payload TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    chunk_index INT NOT NULL,
    token_count INT NOT NULL DEFAULT 0,
    ingested_by UUID NOT NULL,
    file_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Async ingestion job tracking (Realtime-enabled)
CREATE TABLE ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id UUID REFERENCES clinic_documents(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    category TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
    progress_pct INT NOT NULL DEFAULT 0,
    chunks_total INT NOT NULL DEFAULT 0,
    chunks_done INT NOT NULL DEFAULT 0,
    error_message TEXT,
    ingested_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clinic_documents_tenant ON clinic_documents(tenant_id);
CREATE INDEX idx_clinic_protocols_tenant ON clinic_protocols(tenant_id);
CREATE INDEX idx_clinic_protocols_document ON clinic_protocols(document_id);
CREATE INDEX idx_clinic_protocols_category ON clinic_protocols(tenant_id, category);
CREATE INDEX idx_ingestion_jobs_tenant ON ingestion_jobs(tenant_id);

-- HNSW index for low-latency semantic search
CREATE INDEX idx_clinic_protocols_embedding ON clinic_protocols
    USING hnsw (embedding vector_cosine_ops);

-- RLS
ALTER TABLE clinic_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY clinic_documents_tenant ON clinic_documents
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY clinic_protocols_tenant ON clinic_protocols
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY ingestion_jobs_tenant ON ingestion_jobs
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Semantic similarity search
CREATE OR REPLACE FUNCTION match_clinic_protocols(
    query_embedding vector(1536),
    match_tenant_id UUID,
    match_threshold FLOAT DEFAULT 0.78,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    content_payload TEXT,
    category TEXT,
    source_filename TEXT,
    chunk_index INT,
    similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        cp.id,
        cp.document_id,
        cp.content_payload,
        cp.category,
        cp.source_filename,
        cp.chunk_index,
        1 - (cp.embedding <=> query_embedding) AS similarity
    FROM clinic_protocols cp
    WHERE cp.tenant_id = match_tenant_id
      AND 1 - (cp.embedding <=> query_embedding) > match_threshold
    ORDER BY cp.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Extend JWT hook: inject clinic_role from profiles.role
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    claims JSONB;
    user_tenant_id UUID;
    user_role TEXT;
BEGIN
    SELECT tenant_id, role INTO user_tenant_id, user_role
    FROM public.profiles
    WHERE id = (event ->> 'user_id')::uuid;

    claims := event -> 'claims';

    IF user_tenant_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id::text));
    END IF;

    IF user_role IS NOT NULL THEN
        claims := jsonb_set(claims, '{clinic_role}', to_jsonb(user_role));
    END IF;

    event := jsonb_set(event, '{claims}', claims);
    RETURN event;
END;
$$;

-- Enable Realtime on ingestion_jobs for admin progress UI
ALTER PUBLICATION supabase_realtime ADD TABLE ingestion_jobs;
