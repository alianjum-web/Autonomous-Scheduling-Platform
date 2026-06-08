"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Settings,
  Stethoscope,
  X,
} from "lucide-react";

import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { ThemeToggle } from "@/components/common/atoms/ThemeToggle";
import { SiteFooter } from "@/components/common/organisms/SiteFooter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/chat", label: "Patient Chat", icon: MessageSquare },
  { href: "/front-desk", label: "Front Desk", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/clinic-docs", label: "Clinic Docs", icon: FileText },
] as const;

export function MarketingShell({ children }: { children: React.ReactNode }) {
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
    <>
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-md">
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
          aria-label="Main"
        >
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Stethoscope className="size-5" aria-hidden />
            </span>
            <span className="hidden sm:inline">Symptra Scheduling</span>
          </Link>

          <div className="hidden items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1 md:flex">
            {NAV_LINKS.slice(0, 3).map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn("pill-nav", active ? "pill-nav-active" : "pill-nav-inactive")}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {loading ? (
              <div className="size-9 animate-pulse rounded-full bg-muted" />
            ) : session ? (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden rounded-full sm:inline-flex">
                  <Link href="/settings">
                    <Settings className="size-4" aria-hidden />
                    Settings
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="hidden rounded-full sm:inline-flex"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden rounded-full sm:inline-flex">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button size="sm" asChild className="hidden rounded-full shadow-sm sm:inline-flex">
                  <Link href="/sign-up">Get started</Link>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl md:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </nav>

        {mobileOpen ? (
          <div className="border-t border-border/60 bg-card px-4 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium",
                    pathname === href ? "sidebar-nav-active" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </>
  );
}
