-- HIPAA BAA tracking: AI features blocked until clinic admin acknowledges BAA

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS hipaa_baa_signed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS hipaa_baa_signed_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN tenants.hipaa_baa_signed_at IS
    'When set, tenant may use AI triage, embeddings, and PHI-adjacent features.';
