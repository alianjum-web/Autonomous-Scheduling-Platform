export function LoadingScreen({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
      <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
