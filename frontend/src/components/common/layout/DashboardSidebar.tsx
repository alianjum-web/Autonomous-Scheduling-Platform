"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BookOpen,
  ExternalLink,
  HelpCircle,
  LogOut,
  Stethoscope,
} from "lucide-react";

import {
  selectAuthLoading,
  selectAuthProfileReady,
  selectClinicRole,
  selectDefaultHome,
  selectIsAuthenticated,
  selectIsClinicManager,
  selectTenantId,
} from "@/components/auth/store/authSelectors";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { useGetUserProfileQuery } from "@/components/common/store/settingsApi";
import {
  clinicBookingUrl,
  navForRole,
  navSectionsForRole,
  type NavItem,
} from "@/lib/nav/roleNav";
import { ROLE_LABELS, type ClinicRole } from "@/types/auth";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAppSelector } from "@/components/common/store/hooks";

const SECONDARY_NAV = [
  { href: "/help", label: "Help Center", icon: HelpCircle },
  { href: "/status", label: "System Status", icon: Activity },
] as const;

const navLinkClass = (active: boolean) =>
  cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
    active
      ? "sidebar-nav-active"
      : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
  );

/** Highlight the most specific nav item (e.g. /doctor/triage, not /doctor). */
function isNavItemActive(pathname: string, href: string, navItems: NavItem[]): boolean {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  return !navItems.some(
    (item) =>
      item.href !== href &&
      item.href.startsWith(`${href}/`) &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );
}

function roleBadgeClass(role: ClinicRole | null) {
  if (role === "admin") return "bg-primary/10 text-primary";
  if (role === "doctor") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  if (role === "clinic_admin") return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
  return "bg-muted text-muted-foreground";
}

function SidebarNavLinks({
  items,
  pathname,
  allItems,
}: {
  items: NavItem[];
  pathname: string;
  allItems: NavItem[];
}) {
  return items.map(({ href, label, icon: Icon }) => {
    const active = isNavItemActive(pathname, href, allItems);
    return (
      <Link key={href} href={href} className={navLinkClass(active)}>
        <Icon className="size-4 shrink-0" aria-hidden />
        {label}
      </Link>
    );
  });
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuthSession();
  const authLoading = useAppSelector(selectAuthLoading);
  const profileReady = useAppSelector(selectAuthProfileReady);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const clinicRole = useAppSelector(selectClinicRole);
  const tenantId = useAppSelector(selectTenantId);
  const isClinicManager = useAppSelector(selectIsClinicManager);
  const defaultHome = useAppSelector(selectDefaultHome);
  const mainNav = navForRole(clinicRole);
  const navSections = navSectionsForRole(clinicRole);
  const navLoading = authLoading || (isAuthenticated && !profileReady);

  const { data: userProfile } = useGetUserProfileQuery(undefined, {
    skip: !isClinicManager || !tenantId,
  });
  const patientBookingUrl = userProfile?.workspaceSlug
    ? clinicBookingUrl(userProfile.workspaceSlug, "visit")
    : null;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const skeletonCount = navSections
    ? navSections.reduce((n, s) => n + s.items.length, 0)
    : mainNav.length || 6;

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border/60 bg-sidebar">
      <div className="flex h-16 items-center gap-3 border-b border-border/60 px-5">
        <Link href={defaultHome} className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            <Stethoscope className="size-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-foreground">Symptra</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Scheduling
            </p>
          </div>
        </Link>
      </div>

      {clinicRole ? (
        <div className="px-4 pt-4">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
              roleBadgeClass(clinicRole),
            )}
          >
            {ROLE_LABELS[clinicRole]}
          </span>
        </div>
      ) : null}

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-4" aria-label="Dashboard">
        {navLoading ? (
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Menu
            </p>
            {Array.from({ length: skeletonCount }, (_, index) => (
              <div
                key={`nav-skeleton-${index}`}
                className="mx-3 h-10 animate-pulse rounded-xl bg-muted/60"
                aria-hidden
              />
            ))}
          </div>
        ) : navSections ? (
          navSections.map((section) => (
            <div key={section.label} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
              <SidebarNavLinks items={section.items} pathname={pathname} allItems={mainNav} />
            </div>
          ))
        ) : (
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Menu
            </p>
            <SidebarNavLinks items={mainNav} pathname={pathname} allItems={mainNav} />
          </div>
        )}

        {!navLoading && patientBookingUrl ? (
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Shortcuts
            </p>
            <a
              href={patientBookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={navLinkClass(false)}
            >
              <ExternalLink className="size-4 shrink-0" aria-hidden />
              Patient booking page
            </a>
          </div>
        ) : null}

        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Support
          </p>
          {SECONDARY_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className={navLinkClass(active)}>
                <Icon className="size-4 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-border/60 p-4">
        {session ? (
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="size-4" aria-hidden />
            Logout
          </button>
        ) : (
          <Link
            href="/sign-in"
            className="flex items-center gap-3 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-sm"
          >
            <BookOpen className="size-4" aria-hidden />
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}
