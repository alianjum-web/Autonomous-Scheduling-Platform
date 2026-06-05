-- Section 4.1: Deterministic emergency guardrails

-- Admin-only emergency keyword configuration (reviewed quarterly by clinical staff)
CREATE TABLE emergency_keyword_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    pattern TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emergency_keywords_tenant ON emergency_keyword_config(tenant_id);
CREATE INDEX idx_emergency_keywords_active ON emergency_keyword_config(is_active) WHERE is_active = true;

ALTER TABLE emergency_keyword_config ENABLE ROW LEVEL SECURITY;

-- Admin/clinic_admin only — patients must never read keyword list
CREATE POLICY emergency_keywords_admin ON emergency_keyword_config
    FOR ALL USING (
        (auth.jwt() ->> 'clinic_role') IN ('admin', 'clinic_admin')
    );

-- Seed global default patterns (tenant_id NULL = platform-wide defaults)
INSERT INTO emergency_keyword_config (tenant_id, pattern, description) VALUES
    (NULL, '\bchest\s+pain\b', 'Chest pain'),
    (NULL, '\bcant\s+breathe\b', 'Cannot breathe'),
    (NULL, '\bcannot\s+breathe\b', 'Cannot breathe'),
    (NULL, '\bshortness\s+of\s+breath\b', 'Shortness of breath'),
    (NULL, '\bstroke\b', 'Stroke'),
    (NULL, '\bheart\s+attack\b', 'Heart attack'),
    (NULL, '\bseizure\b', 'Seizure'),
    (NULL, '\bunconscious\b', 'Unconscious'),
    (NULL, '\bpassing\s+out\b', 'Passing out'),
    (NULL, '\bsevere\s+bleeding\b', 'Severe bleeding'),
    (NULL, '\boverdose\b', 'Overdose'),
    (NULL, '\bsuicid\b', 'Suicidal ideation'),
    (NULL, '\bcan''t\s+feel\b', 'Loss of sensation'),
    (NULL, '\bnumbness\b.*\bface\b', 'Facial numbness'),
    (NULL, '\b911\b', '911 call'),
    (NULL, '\bemergency\b.*\broom\b', 'Emergency room'),
    (NULL, '\bER\b', 'Emergency room');

-- Layer 3: DB trigger broadcasts emergency to front-desk Realtime channel
CREATE OR REPLACE FUNCTION notify_emergency_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.current_triage_status = 'emergency'
       AND (OLD.current_triage_status IS DISTINCT FROM 'emergency') THEN
        NEW.escalated_at := COALESCE(NEW.escalated_at, NOW());
        -- Supabase Realtime CDC on patient_sessions delivers UPDATE to front-desk subscribers
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emergency_session ON patient_sessions;
CREATE TRIGGER trg_emergency_session
    BEFORE UPDATE ON patient_sessions
    FOR EACH ROW
    WHEN (NEW.current_triage_status = 'emergency')
    EXECUTE FUNCTION notify_emergency_session();
