"use client";

import Link from "next/link";
import { Bell, Search } from "lucide-react";

import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { ThemeToggle } from "@/components/common/atoms/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DashboardTopbar() {
  const { session, loading } = useAuthSession();
  const displayName =
    (session?.user?.user_metadata?.full_name as string) ||
    session?.user?.email?.split("@")[0] ||
    "Guest";

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-border/60 bg-card/80 px-6 backdrop-blur-md">
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search patients, appointments…"
          className="h-10 rounded-full border-border/60 bg-muted/50 pl-10"
          readOnly
          aria-label="Search"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground lg:inline">
          ⌘ K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="size-9 rounded-xl" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>

        {loading ? (
          <div className="size-9 animate-pulse rounded-full bg-muted" />
        ) : session ? (
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 py-1 pl-1 pr-3 transition-colors hover:bg-muted/60"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
              {displayName}
            </span>
          </Link>
        ) : (
          <Button asChild size="sm" className="rounded-full shadow-sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
