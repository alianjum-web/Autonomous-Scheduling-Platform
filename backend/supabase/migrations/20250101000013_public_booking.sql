-- Public booking pages: clinics publish a patient-facing URL without workspace membership.

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS booking_welcome_message TEXT;

COMMENT ON COLUMN tenants.booking_enabled IS 'When true, /book/{slug} is publicly accessible for patient triage.';
COMMENT ON COLUMN tenants.booking_welcome_message IS 'Optional hero copy on the public booking landing page.';

CREATE OR REPLACE FUNCTION public.get_public_clinic(p_slug TEXT)
RETURNS TABLE (id UUID, slug TEXT, name TEXT, welcome_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_slug TEXT;
BEGIN
    v_slug := lower(regexp_replace(trim(p_slug), '[^a-z0-9-]', '-', 'g'));
    v_slug := regexp_replace(v_slug, '-+', '-', 'g');
    v_slug := trim(both '-' from v_slug);

    RETURN QUERY
    SELECT t.id, t.slug, t.name, t.booking_welcome_message
    FROM tenants t
    WHERE t.slug = v_slug
      AND t.booking_enabled = true
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_clinic(TEXT) TO anon, authenticated;

-- Owner/admin toggles public booking page for their tenant.
CREATE OR REPLACE FUNCTION public.set_booking_page(
    p_enabled BOOLEAN,
    p_welcome_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_tenant_id UUID;
    v_role TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT tenant_id, role INTO v_tenant_id, v_role
    FROM profiles WHERE id = v_user_id;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Complete clinic setup before publishing a booking page';
    END IF;

    IF v_role NOT IN ('admin', 'clinic_admin') THEN
        RAISE EXCEPTION 'Only clinic staff can manage the booking page';
    END IF;

    UPDATE tenants
    SET booking_enabled = p_enabled,
        booking_welcome_message = NULLIF(trim(p_welcome_message), ''),
        updated_at = NOW()
    WHERE id = v_tenant_id;

    RETURN p_enabled;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_booking_page(BOOLEAN, TEXT) TO authenticated;

-- Auto-enable booking page when owner creates clinic (can disable in Settings).
CREATE OR REPLACE FUNCTION public.complete_onboarding(
    p_clinic_name TEXT,
    p_clinic_slug TEXT,
    p_role TEXT DEFAULT 'admin'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_tenant_id UUID;
    v_full_name TEXT;
    v_slug TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_clinic_name IS NULL OR length(trim(p_clinic_name)) < 2 THEN
        RAISE EXCEPTION 'Clinic name is required';
    END IF;

    v_slug := lower(regexp_replace(trim(p_clinic_slug), '[^a-z0-9-]', '-', 'g'));
    v_slug := regexp_replace(v_slug, '-+', '-', 'g');
    v_slug := trim(both '-' from v_slug);

    IF length(v_slug) < 2 THEN
        RAISE EXCEPTION 'Invalid clinic slug';
    END IF;

    IF p_role <> 'admin' THEN
        RAISE EXCEPTION 'Only a clinic owner (admin) can create a new workspace.';
    END IF;

    SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = v_user_id;
    IF v_tenant_id IS NOT NULL THEN
        RETURN v_tenant_id;
    END IF;

    SELECT raw_user_meta_data ->> 'full_name' INTO v_full_name
    FROM auth.users WHERE id = v_user_id;

    BEGIN
        INSERT INTO tenants (slug, name, booking_enabled)
        VALUES (v_slug, trim(p_clinic_name), true)
        RETURNING id INTO v_tenant_id;
    EXCEPTION
        WHEN unique_violation THEN
            RAISE EXCEPTION
                'Workspace URL "%" is already registered. Staff should request an invite; patients should use /book/% instead.',
                v_slug, v_slug;
    END;

    INSERT INTO profiles (id, tenant_id, full_name, role)
    VALUES (v_user_id, v_tenant_id, v_full_name, 'admin');

    RETURN v_tenant_id;
END;
$$;
