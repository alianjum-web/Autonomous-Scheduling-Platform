"""Integration test placeholder for Supabase RLS cross-tenant isolation.

Requires a live Supabase instance. Skip in CI unless SUPABASE_INTEGRATION=1.
"""

import os

import pytest

pytestmark = pytest.mark.skipif(
    os.environ.get("SUPABASE_INTEGRATION") != "1",
    reason="Set SUPABASE_INTEGRATION=1 to run live Supabase RLS tests",
)


@pytest.mark.asyncio
async def test_cross_tenant_query_returns_zero_rows():
    """Verify RLS prevents cross-tenant session reads."""
    # Live integration: connect with tenant A JWT, query tenant B session → 0 rows
    pytest.skip("Requires live Supabase project with seeded tenants")
