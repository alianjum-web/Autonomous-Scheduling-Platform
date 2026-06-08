"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  User,
  X,
} from "lucide-react";

import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/chat", label: "Patient Chat", icon: MessageSquare },
  { href: "/front-desk", label: "Front Desk", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/clinic-docs", label: "Clinic Docs", icon: FileText },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAuthSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Main">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              AS
            </span>
            <span className="hidden sm:inline">Autonomous Scheduling</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="size-9 animate-pulse rounded-full bg-muted" />
          ) : session ? (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden gap-1.5 sm:inline-flex">
                <Link href="/settings">
                  <Settings className="size-4" aria-hidden />
                  Settings
                </Link>
              </Button>
              <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm lg:flex">
                <User className="size-4 text-muted-foreground" aria-hidden />
                <span className="max-w-[140px] truncate text-muted-foreground">
                  {session.user.email}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden gap-1.5 sm:inline-flex">
                <LogOut className="size-4" aria-hidden />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button size="sm" asChild className="hidden shadow-sm sm:inline-flex">
                <Link href="/sign-up">Get started</Link>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </nav>

      {mobileOpen ? (
        <div className="border-t border-border/80 bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              );
            })}
            {session ? (
              <>
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground"
                >
                  <Settings className="size-4" aria-hidden />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    void handleSignOut();
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground"
                >
                  <LogOut className="size-4" aria-hidden />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-primary"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
