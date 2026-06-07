-- Sprint 4: Production hardening, audit logs, extended appointments

ALTER TABLE patient_sessions
    ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS patient_name TEXT;

ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS provider_name TEXT DEFAULT 'General Practice',
    ADD COLUMN IF NOT EXISTS treatment_type TEXT DEFAULT 'consultation',
    ADD COLUMN IF NOT EXISTS scheduled_timestamp TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 30,
    ADD COLUMN IF NOT EXISTS external_event_id TEXT;

-- Backfill scheduled_timestamp from slot_start
UPDATE appointments SET scheduled_timestamp = slot_start WHERE scheduled_timestamp IS NULL;
UPDATE appointments SET external_event_id = calendar_event_id WHERE external_event_id IS NULL;

-- Expand status values
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'no_show', 'completed'));

-- Prevent double-booking per provider
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_provider_slot
    ON appointments (tenant_id, provider_name, scheduled_timestamp)
    WHERE status NOT IN ('cancelled', 'no_show');

-- PHI audit log (append-only)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_id UUID,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_tenant_read ON audit_logs
    FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY audit_logs_insert ON audit_logs
    FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Auto-audit triggers for session and appointment mutations
CREATE OR REPLACE FUNCTION audit_phi_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO audit_logs (tenant_id, action, resource_type, resource_id, metadata)
    VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id)::text,
        jsonb_build_object(
            'status', COALESCE(NEW.status, OLD.status),
            'triage_status', COALESCE(NEW.current_triage_status, OLD.current_triage_status)
        )
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_patient_sessions ON patient_sessions;
CREATE TRIGGER audit_patient_sessions
    AFTER INSERT OR UPDATE OR DELETE ON patient_sessions
    FOR EACH ROW EXECUTE FUNCTION audit_phi_mutation();

DROP TRIGGER IF EXISTS audit_appointments ON appointments;
CREATE TRIGGER audit_appointments
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION audit_phi_mutation();

-- Realtime CDC for appointments dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
