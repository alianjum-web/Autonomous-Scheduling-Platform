# Backend

FastAPI AI microservice — LangGraph agent orchestration, SSE streaming, and Supabase integration. Part of the [Autonomous Scheduling Platform](../README.md).

## Quick Start

```bash
cp .env.example .env          # fill in Supabase + JWT secret
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Or via Docker Compose (includes Redis):

```bash
docker compose up              # from repository root
```

API available at [http://localhost:8000](http://localhost:8000). Interactive docs at [http://localhost:8000/docs](http://localhost:8000/docs).

## Scripts

```bash
pytest                         # run all tests
pytest tests/test_security.py  # JWT middleware tests
pytest tests/test_triage_stream.py  # SSE streaming tests
```

## Architecture

```
app/
├── main.py                    # FastAPI init, CORS, lifespan warm-up
├── api/v1/endpoints/triage.py # POST /session, GET /stream/{id}
├── core/
│   ├── config.py              # Pydantic BaseSettings
│   ├── security.py            # JWT → tenant_id extraction
│   └── logger.py              # PHI-safe structured JSON logging
└── services/
    ├── agent.py               # LangGraph StateGraph (Sprint 1 skeleton)
    └── supabase_client.py     # Patient session CRUD
```

All endpoints require `Authorization: Bearer <supabase_jwt>` with a `tenant_id` claim.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service-role key (server only) |
| `SUPABASE_JWT_SECRET` | Yes | JWT secret for token verification |
| `FRONTEND_ORIGIN` | No | CORS allowed origin (default `http://localhost:3000`) |
| `REDIS_URL` | No | Redis connection (default `redis://localhost:6379/0`) |
| `DEBUG` | No | Enable debug mode (default `false`) |

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| FastAPI | ≥ 0.136.3 | Async web framework |
| uvicorn | ≥ 0.49.0 | ASGI server |
| pydantic-settings | ≥ 2.14.0 | Environment configuration |
| python-jose | ≥ 3.5.0 | JWT verification |
| httpx | ≥ 0.28.0 | Async HTTP client |
| supabase | ≥ 2.31.0 | Supabase Python client |
| langgraph | ≥ 1.2.0 | Agent orchestration |
| langchain-core | ≥ 1.4.0 | LangGraph foundation |
| redis | ≥ 8.0.0 | Distributed locking (Sprint 3) |

## Documentation

- [Project README](../README.md) — overview, getting started, compliance
- [Architecture](../docs/ARCHITECTURE.md) — backend layers, data flow
- [Database](../docs/DATABASE.md) — schema and RLS
- [Roadmap](../docs/ROADMAP.md) — sprint deliverables
