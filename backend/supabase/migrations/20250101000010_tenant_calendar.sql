-- Per-tenant calendar configuration for real availability (Google Calendar + business hours)

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/New_York',
    ADD COLUMN IF NOT EXISTS calendar_provider TEXT NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
    ADD COLUMN IF NOT EXISTS business_hours_start SMALLINT NOT NULL DEFAULT 9,
    ADD COLUMN IF NOT EXISTS business_hours_end SMALLINT NOT NULL DEFAULT 17,
    ADD COLUMN IF NOT EXISTS slot_duration_minutes SMALLINT NOT NULL DEFAULT 30;

COMMENT ON COLUMN tenants.calendar_provider IS 'none | google | mock — mock uses generated slots when Google is unset';
COMMENT ON COLUMN tenants.google_calendar_id IS 'Google Calendar ID for this clinic (share with platform service account)';