# Architecture

> AI-First Patient Intake & Autonomous Scheduling Platform — Technical Architecture Reference

---

## 1. Global Principles

Every technology decision is driven by production performance, healthcare compliance mandates, and long-term maintainability.

### 1.1 Technology Selection Rationale

| Technology | Role | Clinical Justification |
|---|---|---|
| **Next.js 16** (App Router) | Frontend framework | React Server Components, streaming SSR, built-in route handlers, Vercel-optimized edge deployments |
| **Tailwind CSS + shadcn/ui** | UI system | Utility-first styling with accessible, in-repo component primitives — no vendor lock-in |
| **Redux Toolkit + RTK Query** | State management | Predictable global state for multi-step intake flows; normalized server-state caching and invalidation |
| **Supabase** (PostgreSQL 16) | Primary database | Managed Postgres with Auth (JWT/PKCE), RLS, Realtime WebSockets, pgvector; HIPAA-eligible with BAA |
| **FastAPI** (Python 3.12) | AI microservice | Async-first framework for LangGraph orchestration, LLM streaming, and calendar gateway proxying |
| **LangGraph** | Agent orchestration | Stateful, cyclical multi-agent graph with conditional routing (triage → booking → escalation) |
| **OpenAI GPT-4o / Anthropic Claude** | LLM providers | Dual-provider resilience; all calls proxied through FastAPI — keys never exposed to frontend |
| **pgvector** (1536-dim) | Semantic search | Native Postgres vector store for clinic protocols; cosine-similarity RAG with no external vector DB |
| **Supabase Realtime** | Live notifications | CDC over WebSockets for front-desk dashboards |
| **Redis** (Upstash) | Distributed locking | SET NX/EXPIRE locks prevent double-booking across concurrent patient sessions |

---

## 1.2 Frontend: Module-Based Atomic Design

The frontend enforces strict separation between global shared infrastructure and domain-isolated feature modules. **No module may import from another module** — only from `/common`.

### Current structure (Sprint 1)

```
frontend/src/
├── common/                          # Shared across all modules
│   ├── components/                  # Button, Input, Badge, Modal, Skeleton
│   ├── hooks/                       # useAuthSession, useDebounce, useSupabaseRealtime
│   └── utils/                       # formatDate, sanitizePHI, errorBoundary
│
├── components/
│   ├── ui/                          # shadcn/ui primitives
│   └── patient-triage/              # MODULE: Live patient-facing chat
│       ├── atoms/
│       │   ├── StatusBadge.tsx
│       │   ├── TimeSlotChip.tsx
│       │   ├── TypingIndicator.tsx
│       │   └── EmergencyBanner.tsx  # Hardcoded emergency override banner
│       ├── molecules/
│       │   └── MessageRow.tsx       # Single chat bubble (patient / AI)
│       ├── organisms/
│       │   └── LiveChatPanel.tsx    # Full streaming chat + input box
│       └── screens/
│           └── PatientChatScreen.tsx
│
├── hooks/
│   ├── useStreamingChat.ts          # SSE consumer with exponential backoff retry
│   └── useAuthSession.ts            # Supabase session + tenant context
│
├── store/
│   ├── index.ts                     # configureStore: combines module slices
│   ├── api.ts                       # RTK Query base API
│   └── triageSlice.ts               # messages[], status, sessionId, isStreaming
│
├── lib/supabase/
│   ├── client.ts                    # Browser Supabase client (anon key)
│   └── server.ts                    # Server Component client
│
└── middleware.ts                    # Subdomain → x-tenant-slug header
```

### Planned modules (Sprints 2–4)

```
modules/
├── clinic-docs/                     # Clinic policy & schedule ingestion
│   ├── atoms/         FileUploadChip, IngestionStatusDot
│   ├── molecules/     DocumentCard, ChunkPreviewRow
│   ├── organisms/     DocumentUploader, EmbeddingProgressPanel
│   ├── screens/       ClinicDocsScreen
│   ├── hooks/         useDocumentIngestion
│   └── store/         clinicDocsSlice
│
└── appointments/                      # Appointment management dashboard
    ├── atoms/         AppointmentStatusTag, ProviderAvatar
    ├── molecules/     AppointmentCard, FilterBar
    ├── organisms/     DailyCalendarGrid, AppointmentDetailPanel
    ├── screens/       AppointmentsDashboard
    ├── hooks/         useAppointmentSync
    └── store/         appointmentsSlice
```

---

## 1.3 Backend: Clean Architecture (FastAPI Microservice)

The FastAPI service is the sole AI processing gateway, isolated from the Next.js frontend by a network boundary.

### Current structure (Sprint 1)

```
backend/app/
├── main.py                          # FastAPI init, CORS, lifespan warm-up
│
├── api/v1/
│   ├── router.py                    # Aggregates all v1 endpoint routers
│   └── endpoints/
│       └── triage.py
│           ├── POST /v1/triage/session      # Create patient session
│           └── GET  /v1/triage/stream/{id}  # SSE token streaming
│
├── core/
│   ├── config.py                    # Pydantic BaseSettings (all env vars)
│   ├── security.py                  # JWT verification, tenant_id extraction
│   └── logger.py                    # Structured JSON logger (PHI-safe)
│
└── services/
    ├── agent.py                     # LangGraph StateGraph (classify_intent → respond)
    └── supabase_client.py           # Async session CRUD wrappers
```

### Planned structure (Sprints 2–4)

```
backend/app/
├── api/v1/endpoints/
│   ├── triage.py                    # + escalate, WebSocket alternative
│   ├── schedule.py                  # slots, book (atomic + lock), cancel
│   └── ingest.py                    # document upload, embedding job status
│
├── services/
│   ├── agent.py                     # Full graph: intent_classifier, rag_retriever,
│   │                                # slot_checker, booking_executor,
│   │                                # escalation_trigger, emergency_interceptor
│   ├── embedding.py                 # 512-token chunks, text-embedding-3-small
│   └── rag.py                       # Cosine similarity against clinic_protocols
│
└── adapters/
    ├── calendar_gateway.py          # Google Calendar, DrChrono, Dentrix, Jane App
    └── redis_client.py              # acquire_lock / release_lock (30s TTL)
```

---

## 1.4 System Interaction Diagram

End-to-end data flow for a patient booking an appointment through the AI chat widget:

| # | Action | From | To / Detail |
|---|---|---|---|
| 1 | Patient opens widget | Next.js Widget (Browser) | → Next.js API Route |
| 2 | Session creation | Next.js Route Handler | → FastAPI `POST /v1/triage/session` |
| 3 | Session persisted | FastAPI → Supabase | `INSERT patient_sessions` (RLS tenant isolation) |
| 4 | Patient types message | Browser SSE/WebSocket | → FastAPI `GET /v1/triage/stream/{id}` |
| 5 | Emergency keyword check | FastAPI (deterministic) | Return local emergency data immediately |
| 6 | LangGraph agent invoked | FastAPI `agent.py` | Intent classify → RAG lookup → Slot check |
| 7 | RAG vector search | FastAPI → Supabase pgvector | `SELECT clinic_protocols WHERE embedding ≈ query` |
| 8 | Slot availability check | FastAPI → Redis Lock | Acquire slot lock before calendar query |
| 9 | Calendar query | FastAPI → calendar_gateway | Google Calendar / EHR API availability |
| 10 | Tokens streamed | FastAPI SSE → Browser | Rendered in `LiveChatPanel` |
| 11 | Patient confirms booking | Browser → Next.js → FastAPI | `POST /v1/schedule/book` (atomic) |
| 12 | Front-desk notified | Supabase Realtime | → `FrontDeskWorkspace` via CDC event |

---

## 1.5 Sprint 1 Implementation Notes

### SSE Connection Management

The stream endpoint handles abrupt client disconnects via `asyncio.CancelledError`. On disconnect, session status is set to `abandoned` and resources are released.

```python
# backend/app/api/v1/endpoints/triage.py
async def event_generator():
    try:
        async for token in run_triage_agent(session_id, tenant_id):
            if await request.is_disconnected():
                break
            yield f"data: {token}\n\n"
    except asyncio.CancelledError:
        await supabase_client.update_session_status(session_id, "abandoned")
        raise
    finally:
        yield "data: [DONE]\n\n"
```

### Multi-Tenant Subdomain Routing

```typescript
// frontend/src/middleware.ts
export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const subdomain = host.split(".")[0];
  const res = NextResponse.next();
  res.headers.set("x-tenant-slug", subdomain);
  return res;
}
```

### Edge Cases Handled in Sprint 1

| Scenario | Mitigation |
|---|---|
| JWT expiry mid-session | RTK Query retry + Supabase refresh token silent re-auth |
| FastAPI cold start | Lifespan handler pre-warms LangGraph graph + Supabase pool |
| SSE browser compatibility | `event-source-polyfill` for iPad kiosk scenarios |
| Network interruption | Exponential backoff retry (500ms → 1s → 2s → 4s) before reconnect UI |
| Empty `tenant_id` in JWT | FastAPI returns 403 with `WWW-Authenticate: Bearer error=invalid_token` |
