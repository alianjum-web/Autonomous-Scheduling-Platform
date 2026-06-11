-- Staff email invites: owner invites staff; staff accept via token after sign-in.

CREATE TABLE IF NOT EXISTS staff_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'clinic_admin' CHECK (role IN ('admin', 'clinic_admin')),
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_staff_invites_tenant ON staff_invites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_invites_token ON staff_invites(token);

ALTER TABLE staff_invites ENABLE ROW LEVEL SECURITY;

-- No direct client access — backend service role manages invites.

CREATE OR REPLACE FUNCTION public.accept_staff_invite(p_token UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_email TEXT;
    v_invite RECORD;
    v_full_name TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Sign in before accepting an invite';
    END IF;

    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'User email not found';
    END IF;

    SELECT * INTO v_invite
    FROM staff_invites
    WHERE token = p_token
      AND accepted_at IS NULL
      AND expires_at > NOW()
    LIMIT 1;

    IF v_invite IS NULL THEN
        RAISE EXCEPTION 'Invite is invalid or expired';
    END IF;

    IF lower(trim(v_user_email)) <> lower(trim(v_invite.email)) THEN
        RAISE EXCEPTION 'Sign in with % to accept this invite', v_invite.email;
    END IF;

    IF EXISTS (
        SELECT 1 FROM profiles
        WHERE id = v_user_id AND tenant_id IS NOT NULL AND tenant_id <> v_invite.tenant_id
    ) THEN
        RAISE EXCEPTION 'Your account is already linked to another clinic';
    END IF;

    SELECT raw_user_meta_data ->> 'full_name' INTO v_full_name
    FROM auth.users WHERE id = v_user_id;

    IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) THEN
        UPDATE profiles
        SET tenant_id = v_invite.tenant_id,
            role = v_invite.role,
            updated_at = NOW()
        WHERE id = v_user_id;
    ELSE
        INSERT INTO profiles (id, tenant_id, full_name, role)
        VALUES (v_user_id, v_invite.tenant_id, v_full_name, v_invite.role);
    END IF;

    UPDATE staff_invites
    SET accepted_at = NOW()
    WHERE id = v_invite.id;

    RETURN v_invite.tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_staff_invite(UUID) TO authenticated;
