-- Onboarding: allow users to read their own profile before tenant_id is in JWT
CREATE POLICY profiles_select_own ON profiles
    FOR SELECT USING (id = auth.uid());

-- Inject clinic_role from profiles into JWT (backend reads clinic_role claim)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    claims JSONB;
    user_tenant_id UUID;
    user_role TEXT;
BEGIN
    SELECT tenant_id, role INTO user_tenant_id, user_role
    FROM public.profiles
    WHERE id = (event ->> 'user_id')::uuid;

    claims := event -> 'claims';

    IF user_tenant_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id::text));
    END IF;

    IF user_role IS NOT NULL THEN
        claims := jsonb_set(claims, '{clinic_role}', to_jsonb(user_role));
        claims := jsonb_set(
            claims,
            '{app_metadata}',
            COALESCE(claims -> 'app_metadata', '{}'::jsonb) ||
            jsonb_build_object('role', user_role, 'tenant_id', user_tenant_id::text)
        );
    END IF;

    event := jsonb_set(event, '{claims}', claims);
    RETURN event;
END;
$$;

-- Provision tenant + profile after signup (SECURITY DEFINER bypasses RLS on insert)
CREATE OR REPLACE FUNCTION public.complete_onboarding(
    p_clinic_name TEXT,
    p_clinic_slug TEXT,
    p_role TEXT DEFAULT 'patient'
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

    IF p_role NOT IN ('patient', 'admin', 'clinic_admin') THEN
        RAISE EXCEPTION 'Invalid role';
    END IF;

    SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = v_user_id;
    IF v_tenant_id IS NOT NULL THEN
        RETURN v_tenant_id;
    END IF;

    SELECT raw_user_meta_data ->> 'full_name' INTO v_full_name
    FROM auth.users WHERE id = v_user_id;

    INSERT INTO tenants (slug, name)
    VALUES (v_slug, trim(p_clinic_name))
    RETURNING id INTO v_tenant_id;

    INSERT INTO profiles (id, tenant_id, full_name, role)
    VALUES (v_user_id, v_tenant_id, v_full_name, p_role);

    RETURN v_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_onboarding(TEXT, TEXT, TEXT) TO authenticated;
