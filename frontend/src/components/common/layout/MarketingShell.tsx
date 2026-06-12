"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, Stethoscope, X } from "lucide-react";

import { ThemeToggle } from "@/components/common/atoms/ThemeToggle";
import { SiteFooter } from "@/components/common/organisms/SiteFooter";
import { useMarketingAuthCtas } from "@/components/platform/hooks/useMarketingAuthCtas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const VISITOR_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
] as const;

function isClinicBookingRoute(pathname: string) {
  return pathname.startsWith("/clinic/");
}

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, dashboardHref, authReady } = useMarketingAuthCtas();
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();
  const onBookingPage = isClinicBookingRoute(pathname);

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
            <span className="hidden sm:inline">Symptra</span>
          </Link>

          {!onBookingPage ? (
            <div className="hidden flex-1 items-center justify-center gap-1 px-2 lg:flex">
              <div className="flex items-center gap-1 rounded-full border border-border/70 bg-muted/50 p-1">
                {VISITOR_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "pill-nav px-3 text-xs xl:px-4 xl:text-sm",
                      pathname === href || (href.startsWith("/#") && pathname === "/")
                        ? "pill-nav-active"
                        : "pill-nav-inactive",
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="hidden flex-1 text-center text-sm text-muted-foreground lg:block">
              Patient booking — no account required
            </p>
          )}

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggle />

            {authReady ? (
              session ? (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden rounded-full sm:inline-flex">
                  <Link href={dashboardHref}>Dashboard</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleSignOut()}
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
                {!onBookingPage ? (
                  <Button size="sm" asChild className="rounded-full shadow-sm">
                    <Link href="/sign-up">Start free trial</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild className="rounded-full">
                    <Link href="/sign-in">Clinic staff</Link>
                  </Button>
                )}
              </>
              )
            ) : (
              <div className="size-9 animate-pulse rounded-full bg-muted" />
            )}

            {!onBookingPage ? (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl lg:hidden"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileOpen((o) => !o)}
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            ) : null}
          </div>
        </nav>

        {mobileOpen && !onBookingPage ? (
          <div className="border-t border-border/70 bg-card px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              {VISITOR_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/60"
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
