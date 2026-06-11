-- Split onboarding: clinic staff create tenants; patients join existing clinics.

CREATE OR REPLACE FUNCTION public.complete_onboarding(
    p_clinic_name TEXT,
    p_clinic_slug TEXT,
    p_role TEXT DEFAULT 'clinic_admin'
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

    IF p_role NOT IN ('admin', 'clinic_admin') THEN
        RAISE EXCEPTION 'Only clinic staff can create a workspace. Patients should join an existing clinic instead.';
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
                'Workspace URL "%" is already registered. If you are joining as staff or patient, use Join clinic instead.',
                v_slug;
    END;

    INSERT INTO profiles (id, tenant_id, full_name, role)
    VALUES (v_user_id, v_tenant_id, v_full_name, p_role);

    RETURN v_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_clinic(p_clinic_slug TEXT)
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

    v_slug := lower(regexp_replace(trim(p_clinic_slug), '[^a-z0-9-]', '-', 'g'));
    v_slug := regexp_replace(v_slug, '-+', '-', 'g');
    v_slug := trim(both '-' from v_slug);

    IF length(v_slug) < 2 THEN
        RAISE EXCEPTION 'Enter a valid clinic workspace URL';
    END IF;

    SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = v_user_id;
    IF v_tenant_id IS NOT NULL THEN
        RETURN v_tenant_id;
    END IF;

    SELECT id INTO v_tenant_id FROM tenants WHERE slug = v_slug LIMIT 1;
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Clinic "%" was not found. Check the URL or ask your clinic for an invite link.', v_slug;
    END IF;

    SELECT raw_user_meta_data ->> 'full_name' INTO v_full_name
    FROM auth.users WHERE id = v_user_id;

    INSERT INTO profiles (id, tenant_id, full_name, role)
    VALUES (v_user_id, v_tenant_id, v_full_name, 'patient');

    RETURN v_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_clinics(p_query TEXT)
RETURNS TABLE (slug TEXT, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_query TEXT := trim(p_query);
BEGIN
    IF length(v_query) < 2 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT t.slug, t.name
    FROM tenants t
    WHERE t.slug ILIKE '%' || v_query || '%'
       OR t.name ILIKE '%' || v_query || '%'
    ORDER BY t.name
    LIMIT 10;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_onboarding(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_clinic(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_clinics(TEXT) TO authenticated;
