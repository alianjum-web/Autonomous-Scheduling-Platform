# Database Schema

> Compliant PostgreSQL schema for healthcare multi-tenancy — HIPAA-Aware / GDPR-Aligned

All tables enforce **Row-Level Security**. No application-layer query can read data belonging to a different tenant. The service-role key used in FastAPI bypasses RLS intentionally and is **never** exposed to the browser.

---

## Current Schema (Sprint 1)

Applied via `supabase/migrations/001_initial_schema.sql`.

### Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Tables

#### `tenants` — Multi-Tenant Clinic Registry

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `uuid_generate_v4()` |
| `slug` | TEXT UNIQUE | Subdomain identifier (e.g. `brightsmile`) |
| `name` | TEXT | Clinic display name |
| `created_at` | TIMESTAMPTZ | Auto-set |
| `updated_at` | TIMESTAMPTZ | Auto-set |

#### `profiles` — Clinic Staff Users

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | References `auth.users(id)` |
| `tenant_id` | UUID FK → tenants | Tenant isolation key |
| `full_name` | TEXT | |
| `role` | TEXT | Default `'patient'`; expands to `admin`, `doctor`, `front_desk`, `billing` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `patient_sessions` — Active Intake Threads

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `tenant_id` | UUID FK → tenants | |
| `status` | TEXT | `active` · `completed` · `abandoned` |
| `metadata` | JSONB | Flexible session data |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### Row-Level Security (Sprint 1)

All three tables have RLS enabled. Policies validate `tenant_id` from the JWT:

```sql
-- Example: patient_sessions tenant isolation
CREATE POLICY patient_sessions_tenant_isolation ON patient_sessions
    FOR ALL USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );
```

### Custom JWT Hook

Injects `tenant_id` from the user's profile into JWT claims at login:

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB ...
```

Configure in **Supabase Dashboard → Authentication → Hooks → Custom Access Token**.

---

## Target Schema (Sprints 2–4)

The following extends the Sprint 1 foundation to the full production schema.

### Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";      -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- encryption utilities
```

### `tenants` (extended)

Additional columns for production clinics:

| Column | Type | Notes |
|---|---|---|
| `clinic_name` | TEXT | |
| `timezone` | TEXT | IANA string, default `America/New_York` |
| `external_ehr_provider` | TEXT | `drchrono` · `dentrix` · `jane_app` · `google_calendar` |
| `api_key_hash` | TEXT | SHA-256 hash of EHR API key — plaintext never stored |
| `subscription_tier` | TEXT | `starter` · `pro` · `enterprise` |
| `hipaa_baa_signed_at` | TIMESTAMPTZ | NULL blocks AI features |
| `is_active` | BOOLEAN | Default `TRUE` |

### `clinic_protocols` — RAG Knowledge Base

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `tenant_id` | UUID FK | |
| `source_filename` | TEXT | Original upload name |
| `category` | TEXT | `treatment` · `policy` · `pricing` · `faq` · `insurance` · `aftercare` · `emergency_protocol` |
| `content_payload` | TEXT | Raw text chunk (512 tokens max) |
| `embedding` | VECTOR(1536) | OpenAI `text-embedding-3-small` |
| `chunk_index` | INTEGER | Position within source document |
| `token_count` | INTEGER | |
| `ingested_at` | TIMESTAMPTZ | |
| `ingested_by` | UUID FK → profiles | |

**Index:** HNSW on `embedding` with `vector_cosine_ops` for fast approximate nearest-neighbor search.

**Search function:**

```sql
CREATE OR REPLACE FUNCTION match_clinic_protocols(
    query_embedding VECTOR(1536),
    match_tenant_id UUID,
    match_threshold FLOAT DEFAULT 0.78,
    match_count INT DEFAULT 5
) RETURNS TABLE (id UUID, category TEXT, content_payload TEXT, similarity FLOAT)
```

### `patient_sessions` (extended)

| Column | Type | Notes |
|---|---|---|
| `patient_name` | TEXT | Collected during triage |
| `patient_phone` | TEXT | E.164 format |
| `patient_email` | TEXT | |
| `chief_complaint` | TEXT | First symptom description |
| `current_triage_status` | TEXT | See status enum below |
| `ai_summary` | TEXT | LLM-generated handoff summary |
| `langgraph_thread_id` | TEXT | LangGraph checkpoint identifier |
| `source_channel` | TEXT | `web_widget` · `sms` · `email` |
| `escalated_at` | TIMESTAMPTZ | |

**Triage status enum:** `info_gathering` · `rag_retrieval` · `slot_selection` · `booking` · `confirmed` · `escalated_to_human` · `emergency` · `abandoned`

### `appointments` — Confirmed Bookings

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `tenant_id` | UUID FK | |
| `session_id` | UUID FK → patient_sessions | |
| `treatment_type` | TEXT | |
| `provider_name` | TEXT | Assigned doctor/hygienist |
| `scheduled_timestamp` | TIMESTAMPTZ | |
| `duration_minutes` | INTEGER | Default 30 |
| `status` | TEXT | `pending` · `confirmed` · `cancelled` · `no_show` · `completed` |
| `external_event_id` | TEXT | Google Calendar / EHR event ID |
| `confirmation_code` | TEXT UNIQUE | 8-char auto-generated |
| `cancellation_reason` | TEXT | |

**Unique constraint:** `(tenant_id, provider_name, scheduled_timestamp)` where status is not `cancelled` or `no_show` — last-resort double-booking prevention.

### `audit_logs` — Append-Only Audit Trail

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `tenant_id` | UUID | |
| `actor_id` | UUID | `auth.uid()` at time of action |
| `action` | TEXT | `INSERT` · `UPDATE` · `DELETE` |
| `table_name` | TEXT | |
| `record_id` | UUID | |
| `old_values` | JSONB | PHI fields replaced with `[REDACTED]` |
| `new_values` | JSONB | |
| `ip_address` | INET | |
| `created_at` | TIMESTAMPTZ | |

Audit logs are append-only: no UPDATE or DELETE ever permitted.

---

## Role-Based RLS Policy Matrix

JWT claims injected at login: `tenant_id`, `clinic_role`.

| Table | Role | Permissions |
|---|---|---|
| `patient_sessions` | `admin` | Full CRUD on own clinic |
| `patient_sessions` | `front_desk`, `doctor` | SELECT |
| `patient_sessions` | `front_desk`, `admin` | UPDATE status |
| `appointments` | all staff | SELECT own clinic |
| `appointments` | `admin` | Full CRUD |
| `appointments` | `front_desk`, `admin` | UPDATE |
| `audit_logs` | `admin` | SELECT only |
| `audit_logs` | all authenticated | INSERT only |

---

## PHI Data Handling

| Control | Implementation |
|---|---|
| Logging | `sanitizePHI()` strips identifiers before any log emission |
| Audit redaction | PHI fields in `old_values` / `new_values` replaced with `[REDACTED]` |
| API key storage | EHR keys stored as SHA-256 hash only |
| Service role | Used exclusively server-side in FastAPI; never in browser |
