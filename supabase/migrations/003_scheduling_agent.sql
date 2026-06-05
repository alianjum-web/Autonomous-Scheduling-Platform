-- Sprint 3: Scheduling agent, bookings, LangGraph thread persistence

ALTER TABLE patient_sessions
    ADD COLUMN IF NOT EXISTS langgraph_thread_id TEXT,
    ADD COLUMN IF NOT EXISTS current_triage_status TEXT DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS ai_summary TEXT,
    ADD COLUMN IF NOT EXISTS message_history JSONB NOT NULL DEFAULT '[]';

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES patient_sessions(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    slot_start TIMESTAMPTZ NOT NULL,
    slot_end TIMESTAMPTZ NOT NULL,
    confirmation_code TEXT NOT NULL UNIQUE,
    calendar_event_id TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_slot ON appointments(tenant_id, slot_start);
CREATE INDEX idx_appointments_confirmation ON appointments(confirmation_code);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY appointments_tenant ON appointments
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- LangGraph checkpoint metadata (thread id stored on session; checkpoints in SQLite/file)
CREATE TABLE langgraph_checkpoints (
    thread_id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES patient_sessions(id) ON DELETE CASCADE,
    checkpoint_data JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE langgraph_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY langgraph_checkpoints_tenant ON langgraph_checkpoints
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

ALTER PUBLICATION supabase_realtime ADD TABLE patient_sessions;
