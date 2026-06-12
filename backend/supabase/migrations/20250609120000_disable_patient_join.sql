-- Patients book as guests at /clinic/{slug}; disable workspace join accounts.

CREATE OR REPLACE FUNCTION public.join_clinic(p_clinic_slug TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_slug TEXT;
BEGIN
    v_slug := lower(regexp_replace(trim(p_clinic_slug), '[^a-z0-9-]', '-', 'g'));
    v_slug := regexp_replace(v_slug, '-+', '-', 'g');
    v_slug := trim(both '-' from v_slug);

    RAISE EXCEPTION
        'Patient accounts are not used for booking. Visit /clinic/% to book without signing up.',
        COALESCE(NULLIF(v_slug, ''), 'your-clinic');
END;
$$;

COMMENT ON FUNCTION public.join_clinic(TEXT) IS
    'Deprecated — patients use public /clinic/{slug} guest booking instead of workspace membership.';
