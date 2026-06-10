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

const RESOURCE_LINKS = [
  { href: "/help", label: "Help" },
  { href: "/status", label: "Status" },
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
      <header className="sticky top-0 z-50 border-b border-border/70 bg-card/85 backdrop-blur-md">
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6"
          aria-label="Main"
        >
          <Link href="/" className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Stethoscope className="size-5" aria-hidden />
            </span>
            <span className="hidden sm:inline">Symptra Scheduling</span>
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-1 px-2 lg:flex">
            <div className="flex items-center gap-1 rounded-full border border-border/70 bg-muted/50 p-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "pill-nav px-3 text-xs xl:px-4 xl:text-sm",
                    active ? "pill-nav-active" : "pill-nav-inactive",
                  )}
                >
                  {label}
                </Link>
              );
            })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="hidden items-center gap-1 md:flex">
              {RESOURCE_LINKS.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Button
                    key={href}
                    variant="ghost"
                    size="sm"
                    asChild
                    className={cn("rounded-full text-xs", active && "bg-muted font-medium text-foreground")}
                  >
                    <Link href={href}>{label}</Link>
                  </Button>
                );
              })}
            </div>

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
                <Button size="sm" asChild className="rounded-full shadow-sm">
                  <Link href="/sign-up">Get started</Link>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </nav>

        {mobileOpen ? (
          <div className="border-t border-border/70 bg-card px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium",
                    pathname === href ? "sidebar-nav-active" : "text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              ))}
              <div className="my-2 border-t border-border/60" />
              {RESOURCE_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-medium",
                    pathname === href ? "sidebar-nav-active" : "text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <main className="marketing-page">{children}</main>
      <SiteFooter />
    </>
  );
}
