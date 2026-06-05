import { Badge } from "@/components/ui/badge";
import type { DocumentChunk } from "@/store/api";

interface ChunkPreviewRowProps {
  chunk: DocumentChunk;
  index: number;
}

export function ChunkPreviewRow({ chunk, index }: ChunkPreviewRowProps) {
  return (
    <div className="rounded-lg border p-3 text-sm">
      <div className="mb-2 flex items-center gap-2">
        <Badge variant="outline">Chunk {chunk.chunk_index ?? index}</Badge>
        <span className="text-xs text-muted-foreground">{chunk.token_count} tokens</span>
        {chunk.similarity != null ? (
          <Badge variant="secondary">{(chunk.similarity * 100).toFixed(1)}% match</Badge>
        ) : null}
      </div>
      <p className="line-clamp-3 text-muted-foreground">{chunk.content_payload}</p>
    </div>
  );
}
