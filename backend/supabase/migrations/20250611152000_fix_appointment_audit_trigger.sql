-- audit_phi_mutation referenced current_triage_status on appointments (patient_sessions only).

CREATE OR REPLACE FUNCTION audit_phi_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    meta JSONB;
BEGIN
    meta := jsonb_build_object('status', COALESCE(NEW.status, OLD.status));

    IF TG_TABLE_NAME = 'patient_sessions' THEN
        meta := meta || jsonb_build_object(
            'triage_status', COALESCE(NEW.current_triage_status, OLD.current_triage_status)
        );
    END IF;

    INSERT INTO audit_logs (tenant_id, action, resource_type, resource_id, metadata)
    VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id)::text,
        meta
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;
