# 28-Day Production Shipping Roadmap

> Four 7-day sprints — each ships independently verifiable, clinically valuable functionality.

By Day 28, the platform is hardened and ready for an initial high-end clinic production launch.

---

## Sprint 1 — Days 1–7

### Multi-Tenant Groundwork, Security & Patient Chat UI

**Objective:** Establish complete multi-tenant security infrastructure and deliver a functional patient chat widget that streams tokens from FastAPI. By end of Sprint 1, a patient can open the widget, start a session, and receive streaming AI responses — all behind tenant-isolated data boundaries.

#### Frontend Deliverables

| Task | Status |
|---|---|
| Initialize Next.js 16 with App Router and Tailwind CSS 4 | Done |
| Configure shadcn/ui component library | Done |
| Set up Redux store with RTK Query base API | Done |
| Build `/common`: Button, Input, Badge, Modal, Skeleton | Done |
| Build `patient-triage/atoms`: StatusBadge, TimeSlotChip, TypingIndicator, EmergencyBanner | Done |
| Build `patient-triage/molecules`: MessageRow with streaming text | Done |
| Build `patient-triage/organisms`: LiveChatPanel with SSE consumer | Done |
| Build `patient-triage/screens`: PatientChatScreen route | Done |
| Implement `triageSlice`: messages[], status, sessionId, isStreaming | Done |
| Implement `useStreamingChat`: SSE connect, append tokens to Redux | Done |
| Supabase client setup: anon key, tenant JWT claim extraction | Done |
| Tenant-aware route middleware (subdomain routing) | Done |

#### Backend Deliverables

| Task | Status |
|---|---|
| Initialize FastAPI with uvicorn, async support | Done |
| Configure Pydantic BaseSettings: secrets from env vars only | Done |
| Global CORS: restrict to Next.js origin only | Done |
| `POST /v1/triage/session`: create patient_sessions row | Done |
| `GET /v1/triage/stream/{id}`: SSE endpoint with token streaming | Done |
| Basic LangGraph skeleton: StateGraph with 2 nodes (classify_intent, respond) | Done |
| JWT middleware: extract tenant_id from Bearer token | Done |
| `supabase_client.py`: async session CRUD wrappers | Done |
| Structured JSON logger: auto-redact PHI fields | Done |
| Dockerfile + docker-compose for FastAPI + Redis | Done |
| Supabase schema migrations: tenants, profiles, patient_sessions | Done |
| Supabase Auth with PKCE flow and custom JWT hook | Done |

#### Integration Edge Cases

- **SSE disconnects** — `asyncio.CancelledError` handler sets session to `abandoned`
- **JWT expiry** — RTK Query retry with Supabase refresh token
- **Cold start** — Lifespan handler pre-warms LangGraph graph + Supabase pool
- **SSE compatibility** — EventSource polyfill for older clinic devices
- **Network interruption** — Exponential backoff (500ms → 4s) before reconnect UI

#### Testing Goals

| Type | Scope | Tool | Pass Criteria |
|---|---|---|---|
| Unit | `triageSlice` reducers | Vitest | All state transitions correct |
| Unit | JWT middleware | pytest | Invalid tokens return 403 |
| Integration | SSE streaming endpoint | pytest + httpx | 100 tokens streamed in < 3s |
| Integration | Supabase RLS | pytest | Cross-tenant query returns 0 rows |
| E2E | Patient opens widget + receives response | Playwright | Full flow < 5s wall time |

---

## Sprint 2 — Days 8–14

### Clinic Policy Ingestion & RAG Pipeline

**Objective:** Clinics can upload policy documents (PDF, DOCX, TXT). Documents are chunked, embedded with OpenAI `text-embedding-3-small`, and stored in `clinic_protocols` via pgvector. The agent can retrieve relevant protocol chunks during triage.

#### Deliverables

| Area | Tasks |
|---|---|
| **Database** | `clinic_protocols` table, HNSW index, `match_clinic_protocols()` function |
| **Backend** | `POST /v1/ingest/document`, `GET /v1/ingest/status/{job_id}`, `embedding.py`, `rag.py` |
| **Frontend** | `clinic-docs` module: DocumentUploader, EmbeddingProgressPanel, ClinicDocsScreen |
| **Agent** | Add `rag_retriever` node to LangGraph graph |

#### Key Specs

- Semantic splitter: 512-token chunks, 50-token overlap
- Embedding model: `text-embedding-3-small` (1536 dimensions)
- Similarity threshold: 0.78 default, top 5 results
- Categories: `treatment`, `policy`, `pricing`, `faq`, `insurance`, `aftercare`, `emergency_protocol`

---

## Sprint 3 — Days 15–21

### LangGraph Scheduling Agent & Triage Engine

**Objective:** Full multi-node LangGraph agent handles intent classification, RAG retrieval, slot availability, and atomic booking. Emergency keyword detection provides deterministic override.

#### Deliverables

| Area | Tasks |
|---|---|
| **Agent nodes** | `intent_classifier`, `rag_retriever`, `slot_checker`, `booking_executor`, `escalation_trigger`, `emergency_interceptor` |
| **Backend** | `GET /v1/schedule/slots`, `POST /v1/schedule/book`, `DEL /v1/schedule/cancel/{id}` |
| **Adapters** | `calendar_gateway.py` (Google Calendar + EHR interface), `redis_client.py` (distributed locks) |
| **Database** | Extended `patient_sessions` with triage status enum, `appointments` table |
| **Frontend** | CalendarSelector, SlotBookingDrawer, TriageForm, `useBookingFlow` hook |

#### Medical Guardrails

- **Emergency override** — Deterministic keyword check returns local emergency instructions immediately, bypassing LLM
- **Race condition prevention** — Redis `SET NX/EXPIRE` lock (30s TTL) before calendar query; DB unique constraint as last resort
- **Double-booking** — Unique index on `(tenant_id, provider_name, scheduled_timestamp)` excluding cancelled/no_show

---

## Sprint 4 — Days 22–28

### Human Handoffs, Dashboard & Production Hardening

**Objective:** Front-desk staff receive real-time escalation alerts. Admin dashboard for appointment management. Production hardening with audit logs, monitoring, and CI/CD.

#### Deliverables

| Area | Tasks |
|---|---|
| **Frontend** | `FrontDeskWorkspace`, `AppointmentsDashboard`, `useEscalationWatch`, `useAppointmentSync` |
| **Backend** | `POST /v1/triage/escalate/{id}`, WebSocket alternative for streaming |
| **Database** | `audit_logs` table (append-only), role-based RLS policy matrix |
| **Realtime** | Supabase CDC → front-desk dashboard for appointment and escalation alerts |
| **Infrastructure** | CI/CD pipeline, production Docker images, monitoring, error alerting |
| **Compliance** | Audit log verification, PHI redaction audit, BAA workflow for `hipaa_baa_signed_at` |

#### Production Hardening Checklist

- [ ] All env vars validated at startup (fail fast on missing secrets)
- [ ] Rate limiting on public-facing endpoints
- [ ] Health check endpoints (`/health`, `/ready`)
- [ ] Structured logging with request correlation IDs
- [ ] Graceful shutdown handling in FastAPI lifespan
- [ ] Database connection pooling tuned for production load
- [ ] Nginx/reverse proxy SSE buffering disabled (`X-Accel-Buffering: no`)
- [ ] Playwright E2E suite in CI
- [ ] Cross-tenant isolation penetration test

---

## Feasibility & Error Handling Summary

| Scenario | Strategy |
|---|---|
| Medical emergency detected | Deterministic keyword interceptor — immediate local emergency data, no LLM latency |
| Concurrent booking race | Redis distributed lock → calendar check → atomic DB insert with unique constraint |
| PHI in logs | Auto-redact `patient_phone`, `patient_email`; audit log PHI fields as `[REDACTED]` |
| LLM provider outage | Dual-provider fallback (GPT-4o → Claude Sonnet) |
| Session timeout | Status → `abandoned`; held Redis locks released |
| Tenant without BAA | Block AI features when `hipaa_baa_signed_at` IS NULL |
