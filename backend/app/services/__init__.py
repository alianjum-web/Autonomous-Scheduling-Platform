"""Business workflow layer.

Router -> Service -> Adapter/Repository -> External system

| Module               | Domain                         |
|----------------------|--------------------------------|
| scheduling_service   | Appointments, slots, booking   |
| triage_service       | Sessions, triage, streaming    |
| ingestion_service    | Document upload and RAG ingest |
| agent                | LangGraph triage orchestration |
| embedding            | Chunking and vector storage    |
| emergency_keywords   | Deterministic emergency detect |
| rate_limiter         | Per-session AI rate limits     |
| supabase_client      | Supabase persistence (adapter) |
"""
