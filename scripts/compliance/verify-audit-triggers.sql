-- Section 5.3: Verify audit logging controls
-- Run in Supabase SQL editor before production launch

-- 1. audit_logs table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'audit_logs'
) AS audit_logs_table_exists;

-- 2. Append-only policies (no update/delete)
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'audit_logs'
  AND policyname IN ('audit_logs_no_update', 'audit_logs_no_delete');

-- 3. Mutation triggers on PHI tables
SELECT tgname, tgrelid::regclass AS table_name, tgenabled
FROM pg_trigger
WHERE tgname IN ('audit_patient_sessions', 'audit_appointments')
  AND NOT tgisinternal;

-- 4. Recent audit activity (should populate after test mutations)
SELECT action, resource_type, count(*) AS events
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY action, resource_type
ORDER BY events DESC;
