-- Sprint 1: Multi-tenant groundwork schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'patient',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE patient_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX idx_patient_sessions_tenant_id ON patient_sessions(tenant_id);
CREATE INDEX idx_patient_sessions_status ON patient_sessions(status);

-- Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_sessions ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: users can only access their tenant's data
CREATE POLICY tenants_select_own ON tenants
    FOR SELECT USING (
        id = (auth.jwt() ->> 'tenant_id')::uuid
    );

CREATE POLICY profiles_tenant_isolation ON profiles
    FOR ALL USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

CREATE POLICY patient_sessions_tenant_isolation ON patient_sessions
    FOR ALL USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- Custom JWT hook: inject tenant_id from profile into JWT claims
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    claims JSONB;
    user_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO user_tenant_id
    FROM public.profiles
    WHERE id = (event ->> 'user_id')::uuid;

    claims := event -> 'claims';

    IF user_tenant_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id::text));
    END IF;

    event := jsonb_set(event, '{claims}', claims);
    RETURN event;
END;
$$;
