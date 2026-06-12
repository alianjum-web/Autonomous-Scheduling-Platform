from __future__ import annotations

from typing import Any

from app.services.embedding import embed_batch
from app.services import supabase_client


async def retrieve_context(
    query: str,
    tenant_id: str,
    category_filter: str | None = None,
    match_count: int = 5,
) -> list[dict[str, Any]]:
    query_embedding = (await embed_batch([query]))[0]
    docs = await supabase_client.match_clinic_protocols(
        query_embedding=query_embedding,
        tenant_id=tenant_id,
        match_threshold=0.72,
        match_count=match_count,
    )
    if category_filter:
        docs = [d for d in docs if d.get("category") == category_filter]
    return docs
