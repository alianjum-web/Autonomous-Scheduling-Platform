-- Three-role onboarding: admin creates clinic, patient joins, staff is invited by admin.

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
        RAISE EXCEPTION 'Only a clinic owner (admin) can create a new workspace. Patients join an existing clinic; staff are invited by the owner.';
    END IF;

    SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = v_user_id;
    IF v_tenant_id IS NOT NULL THEN
        RETURN v_tenant_id;
    END IF;

    SELECT raw_user_meta_data ->> 'full_name' INTO v_full_name
    FROM auth.users WHERE id = v_user_id;

    BEGIN
        INSERT INTO tenants (slug, name)
        VALUES (v_slug, trim(p_clinic_name))
        RETURNING id INTO v_tenant_id;
    EXCEPTION
        WHEN unique_violation THEN
            RAISE EXCEPTION
                'Workspace URL "%" is already registered. Patients: use Join clinic. Staff: ask your clinic owner to invite you.',
                v_slug;
    END;

    INSERT INTO profiles (id, tenant_id, full_name, role)
    VALUES (v_user_id, v_tenant_id, v_full_name, 'admin');

    RETURN v_tenant_id;
END;
$$;
