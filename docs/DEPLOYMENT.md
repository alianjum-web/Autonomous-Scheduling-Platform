# Section 5 — Deployment, Infrastructure & CI/CD

## 5.1 Infrastructure Overview

| Component | Provider | Notes |
|---|---|---|
| **Next.js Frontend** | Vercel | Edge network, automatic HTTPS, preview deploys per PR |
| **FastAPI Microservice** | Render | Dockerized, auto-scaled |
| **PostgreSQL + pgvector** | Supabase Cloud | Managed, HIPAA-eligible, automated backups |
| **Redis (Distributed Locks)** | Upstash Redis | Serverless, pay-per-request, global replication |
| **LLM APIs** | OpenAI + Anthropic | Proxied through FastAPI — keys never reach browser |
| **File Storage** | Supabase Storage | Private buckets with signed URLs, encrypted at rest |
| **Error Monitoring** | Sentry | PHI-scrubbed before upload, session replay disabled |
| **Metrics / Observability** | Grafana Cloud + Prometheus | FastAPI `/metrics` endpoint, uptime alerting |
| **CI/CD** | GitHub Actions | Test → Lint → Build → Deploy pipeline on `main` |

---

## Architecture Diagram

```mermaid
flowchart LR
    subgraph edge [Edge]
        Vercel[Vercel Next.js]
    end

    subgraph compute [Compute]
        Render[FastAPI on Render]
    end

    subgraph data [Data Plane]
        Supabase[(Supabase Postgres + pgvector)]
        Upstash[(Upstash Redis)]
        Storage[(Supabase Storage)]
    end

    subgraph external [External APIs]
        OpenAI[OpenAI / Anthropic]
    end

    subgraph observe [Observability]
        Sentry[Sentry]
        Grafana[Grafana Cloud]
    end

    Patient((Patient)) --> Vercel
    Vercel -->|HTTPS JWT| Render
    Render --> Supabase
    Render --> Upstash
    Render --> Storage
    Render --> OpenAI
    Render --> Sentry
    Grafana -->|scrape /metrics| Render
```

---

## CI/CD Pipeline (Section 5.2)

Workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) (`CI & Migrations`)

**GitHub Actions** — quality gates and schema migrations only. **Vercel** and **Render** deploy apps via their own GitHub integrations on every push to `main`.

| Job | Steps | Trigger |
|---|---|---|
| `compliance-check` | PHI logging scan | Every push / PR to `main` |
| `validate-database` | Migration filename + layout checks | Every push / PR to `main` |
| `test-backend` | ruff + pytest + coverage (Redis service) | Every push / PR to `main` |
| `test-frontend` | lint → type-check → build → unit + e2e tests | Every push / PR to `main` |
| `apply-migrations` | `supabase db push` via `scripts/db/push.sh` | `main` push only (after tests pass) |

| Platform | Deploy trigger | Root directory |
|---|---|---|
| Vercel | GitHub push to `main` | `frontend/` |
| Render | GitHub push to `main` | `backend/` |

### GitHub Secrets (production environment)

| Secret | Required? | Used by |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | **Yes** (migrations) | `apply-migrations` |
| `SUPABASE_PROJECT_REF` | **Yes** (migrations) | `apply-migrations` |
| `SUPABASE_URL` | Optional | Backend CI tests |
| `SUPABASE_SERVICE_KEY` | Optional | Backend CI tests |
| `SUPABASE_JWT_SECRET` | Optional | Backend CI tests |
| `OPENAI_API_KEY` | Optional | Backend CI tests |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Frontend CI build/tests |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Frontend CI build/tests |
| `CODECOV_TOKEN` | Optional | Coverage upload |

Runtime secrets (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, etc.) belong on **Vercel** and **Render** — not GitHub.

Configure the `production` environment in GitHub with required reviewers before first migration apply.

### HIPAA compliance gate

The `compliance-check` job runs `scripts/compliance/scan-codebase-for-phi-logging.sh` on every PR. Complete the full pre-launch checklist in [HIPAA_COMPLIANCE.md](./HIPAA_COMPLIANCE.md) before processing real patient data.

---

## Frontend — Vercel

**Root directory:** `frontend/`

```bash
cd frontend
vercel link
vercel env pull .env.local
```

### Environment Variables (Vercel)

| Variable | Example | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Public anon key only |
| `NEXT_PUBLIC_API_URL` | `https://api.yourclinic.com` | Render backend URL |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://...@sentry.io/...` | Optional |
| `NEXT_PUBLIC_ENVIRONMENT` | `production` | |

Preview deployments are created automatically for every pull request.

---

## Backend — Render

**Root directory:** `backend/` (Dockerfile in `backend/`)

Connect the GitHub repository in the Render dashboard (branch: `main`, auto-deploy on push).

### Environment Variables (Render)

| Variable | Notes |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Publishable key — same value as `NEXT_PUBLIC_SUPABASE_ANON_KEY` on Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, never expose to frontend |
| `SUPABASE_JWT_SECRET` | JWT verification |
| `UPSTASH_REDIS_URL` | `rediss://...` for distributed locks |
| `OPENAI_API_KEY` | LLM gateway |
| `FRONTEND_ORIGIN` | Vercel production URL (CORS) |
| `SENTRY_DSN` | PHI-scrubbed error reporting |
| `ENVIRONMENT` | `production` |
| `BAA_ENFORCEMENT` | `true` — blocks AI triage and document ingest until clinic admin acknowledges BAA in Settings |
| `GOOGLE_CALENDAR_ID` | Optional global fallback calendar ID |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | JSON credentials for Google Calendar free/busy (per-tenant calendar IDs in Settings) |

Health check: `GET /health` (configure in Render service settings and Dockerfile).

### Keep Render awake (free tier)

Idle Render services **sleep**; the first request can take 30–60s and Vercel API calls may fail. The repo includes `.github/workflows/render-keepalive.yml` (pings `/health` every 10 minutes). After merging to `main`, enable **Actions** on the repo. Optional: set repository variable `RENDER_API_URL` if your API URL changes.

Verify production from your machine:

```bash
npm run verify:render
```

---

## Database — Supabase

Schema is versioned in `backend/supabase/migrations/`. The FastAPI backend owns the database; the frontend consumes generated types only.

### Local

See [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md). Short version:

```bash
npm install --prefix backend
npm run db:validate
export SUPABASE_DB_PASSWORD='<database-password>'
npm run db:link -- --project-ref <ref>   # once
npm run db:push
npm run gen:types                        # refresh frontend/src/types/database.ts
```

### CI/CD (GitHub Actions)

| Job | When | Action |
|---|---|---|
| `validate-database` | Every PR / push | Filename + layout checks (`scripts/db/validate-migrations.sh`) |
| `apply-migrations` | Push to `main` (after tests) | `supabase db push` via `scripts/db/push.sh` |

Required GitHub secrets (production environment):

| Secret | Purpose |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI auth ([Account → Access Tokens](https://supabase.com/dashboard/account/tokens)) |
| `SUPABASE_PROJECT_REF` | Project ref from Supabase dashboard URL |
| `SUPABASE_DB_PASSWORD` | Database password (Database → Settings) — required for `db push` in CI |

Migrations run on `main` after quality gates pass. Vercel and Render deploy in parallel via GitHub webhooks.

Local migration workflow: [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md).

**Pre-launch checklist:**

- [ ] Execute Supabase HIPAA BAA (qualifying plan)
- [ ] Enable automated backups (default on Pro+)
- [ ] Configure Custom Access Token Hook
- [ ] Schedule `purge_expired_patient_sessions()` via pg_cron or Edge Function

---

## Observability

### Prometheus Metrics

FastAPI exposes `GET /metrics` (Prometheus text format).

Grafana Cloud scrape config example:

```yaml
scrape_configs:
  - job_name: asp-api
    scrape_interval: 30s
    metrics_path: /metrics
    static_configs:
      - targets: ["api.yourclinic.com:443"]
    scheme: https
```

### Sentry

- Backend: `SENTRY_DSN` — PHI scrubbed via `before_send` in `app/core/sentry.py`
- Frontend: `NEXT_PUBLIC_SENTRY_DSN` — scrubbed via `sanitizePHI()` in `SentryInit`
- Session replay: **disabled** (`sendDefaultPii: false`)

### Uptime Alerting

Point Grafana Cloud synthetic checks or UptimeRobot at:

- `https://your-app.vercel.app` (frontend)
- `https://api.yourclinic.com/health` (backend)

---

## Local Development

```bash
docker compose up --build    # Redis + FastAPI
cd frontend && npm run dev   # Next.js on :3000
```

---

## AWS ECS Alternative

The same [`backend/Dockerfile`](../backend/Dockerfile) can deploy to ECS/Fargate:

1. Push image to ECR
2. Task definition with env vars from AWS Secrets Manager
3. ALB health check on `/health`
4. Private subnet egress for Supabase / Upstash / OpenAI

Render is the recommended path for Sprint delivery; ECS for enterprise VPC requirements.
