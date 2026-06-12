-- Structured clinic facts for AI triage (hours, services) — complements uploaded PDF/FAQ docs.

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS clinic_hours_info TEXT,
    ADD COLUMN IF NOT EXISTS clinic_services TEXT;

COMMENT ON COLUMN tenants.clinic_hours_info IS
    'Human-readable clinic hours shown to the AI intake assistant (e.g. Mon–Fri 9am–5pm).';
COMMENT ON COLUMN tenants.clinic_services IS
    'List of services the clinic offers — used by AI to answer patient questions (e.g. blood tests, cleanings).';
