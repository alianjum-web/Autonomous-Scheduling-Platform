-- Section 4.3: PHI security controls — immutable audit logs, retention, private storage

-- 7. Audit logs: append-only (no updates or deletes via API roles)
CREATE POLICY audit_logs_no_update ON audit_logs
    FOR UPDATE USING (false);

CREATE POLICY audit_logs_no_delete ON audit_logs
    FOR DELETE USING (false);

-- 8. Data retention: purge patient sessions older than 7 years (HIPAA minimum)
CREATE OR REPLACE FUNCTION purge_expired_patient_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM patient_sessions
    WHERE created_at < NOW() - INTERVAL '7 years';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION purge_expired_patient_sessions IS
    'HIPAA retention purge — schedule via pg_cron or Supabase Edge Function';

-- 4. Storage: private bucket for patient-uploaded files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('patient-uploads', 'patient-uploads', false, 52428800)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS patient_uploads_tenant_insert ON storage.objects;
DROP POLICY IF EXISTS patient_uploads_tenant_select ON storage.objects;
DROP POLICY IF EXISTS patient_uploads_tenant_delete ON storage.objects;

CREATE POLICY patient_uploads_tenant_insert ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'patient-uploads'
        AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
    );

CREATE POLICY patient_uploads_tenant_select ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'patient-uploads'
        AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
    );

CREATE POLICY patient_uploads_tenant_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'patient-uploads'
        AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
    );
