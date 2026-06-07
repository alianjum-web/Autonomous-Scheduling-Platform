-- Section 4.2: PostgreSQL unique index (last-resort DB constraint)
-- Catches races that slip past Redis (e.g. network partition)

DROP INDEX IF EXISTS idx_appointments_provider_slot;

CREATE UNIQUE INDEX IF NOT EXISTS idx_appt_provider_time
    ON appointments (tenant_id, provider_name, scheduled_timestamp)
    WHERE status NOT IN ('cancelled', 'no_show');
