import { cn } from "@/lib/utils";

const COLORS = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500"];

function hashColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function ProviderAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name // Ali Anjum -> AA
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white",
        hashColor(name),
        className,
      )}
      title={name}
      aria-label={`Provider: ${name}`}
    >
      {initials}
    </div>
  );
}
