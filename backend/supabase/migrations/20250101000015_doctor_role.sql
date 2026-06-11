-- Doctor role + providers registry for owner / doctor / patient separation.

CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    specialty TEXT NOT NULL DEFAULT 'General Practice',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    availability_start TIME NOT NULL DEFAULT '09:00',
    availability_end TIME NOT NULL DEFAULT '17:00',
    slot_duration_minutes INT NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_providers_tenant ON providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_providers_profile ON providers(profile_id);

ALTER TABLE staff_invites DROP CONSTRAINT IF EXISTS staff_invites_role_check;
ALTER TABLE staff_invites ADD CONSTRAINT staff_invites_role_check
    CHECK (role IN ('admin', 'clinic_admin', 'doctor'));

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

    IF v_invite.role = 'doctor' THEN
        INSERT INTO providers (tenant_id, profile_id, display_name, specialty)
        VALUES (
            v_invite.tenant_id,
            v_user_id,
            COALESCE(NULLIF(trim(v_full_name), ''), split_part(v_user_email, '@', 1)),
            'General Practice'
        )
        ON CONFLICT (tenant_id, profile_id) DO UPDATE
        SET is_active = TRUE,
            display_name = EXCLUDED.display_name,
            updated_at = NOW();
    END IF;

    UPDATE staff_invites
    SET accepted_at = NOW()
    WHERE id = v_invite.id;

    RETURN v_invite.tenant_id;
END;
$$;
