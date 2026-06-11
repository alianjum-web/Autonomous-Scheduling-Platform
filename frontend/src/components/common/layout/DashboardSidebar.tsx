"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BookOpen,
  HelpCircle,
  Home,
  LogOut,
  Stethoscope,
} from "lucide-react";

import {
  selectClinicRole,
  selectDefaultHome,
} from "@/components/auth/store/authSelectors";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { navForRole } from "@/lib/nav/roleNav";
import { ROLE_LABELS, type ClinicRole } from "@/types/auth";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAppSelector } from "@/components/common/store/hooks";

const SECONDARY_NAV = [
  { href: "/help", label: "Help Center", icon: HelpCircle },
  { href: "/status", label: "System Status", icon: Activity },
] as const;

function roleBadgeClass(role: ClinicRole | null) {
  if (role === "admin") return "bg-primary/10 text-primary";
  if (role === "doctor") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  if (role === "clinic_admin") return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
  return "bg-muted text-muted-foreground";
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuthSession();
  const clinicRole = useAppSelector(selectClinicRole);
  const defaultHome = useAppSelector(selectDefaultHome);
  const mainNav = navForRole(clinicRole);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

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
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              pathname === "/"
                ? "sidebar-nav-active"
                : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Home className="size-4 shrink-0" aria-hidden />
            Home
          </Link>
          {mainNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "sidebar-nav-active"
                    : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Support
          </p>
          {SECONDARY_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "sidebar-nav-active"
                    : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                )}
              >
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
