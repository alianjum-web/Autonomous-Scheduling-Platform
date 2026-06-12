"use client";

import Link from "next/link";

import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { selectDashboardHref } from "@/components/auth/store/authSelectors";
import { useAppSelector } from "@/components/common/store/hooks";

export function SiteFooter() {
  const { session } = useAuthSession();
  const dashboardHref = useAppSelector(selectDashboardHref);

  return (
    <footer className="border-t border-border/70 bg-card/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-lg font-bold tracking-tight">Symptra Scheduling</p>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI-first patient intake · HIPAA-aware · Multi-tenant clinical scheduling
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-4 sm:gap-10">
            <div className="space-y-3">
              <p className="font-semibold text-foreground">Product</p>
              <div className="flex flex-col gap-2.5 text-muted-foreground">
                <Link href="/chat" className="transition-colors hover:text-foreground">
                  AI Triage (staff)
                </Link>
                <Link href="/front-desk" className="transition-colors hover:text-foreground">
                  Front Desk
                </Link>
                <Link href="/appointments" className="transition-colors hover:text-foreground">
                  Appointments
                </Link>
                <Link href="/clinic-docs" className="transition-colors hover:text-foreground">
                  Clinic Docs
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-foreground">Account</p>
              <div className="flex flex-col gap-2.5 text-muted-foreground">
                {session ? (
                  <>
                    <Link href={dashboardHref} className="transition-colors hover:text-foreground">
                      Dashboard
                    </Link>
                    <Link href="/settings" className="transition-colors hover:text-foreground">
                      Settings
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/sign-in" className="transition-colors hover:text-foreground">
                      Staff sign in
                    </Link>
                    <Link href="/sign-up" className="transition-colors hover:text-foreground">
                      Start clinic trial
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-foreground">Support</p>
              <div className="flex flex-col gap-2.5 text-muted-foreground">
                <Link href="/help" className="transition-colors hover:text-foreground">
                  Help Center
                </Link>
                <Link href="/status" className="transition-colors hover:text-foreground">
                  System Status
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-foreground">Legal</p>
              <div className="flex flex-col gap-2.5 text-muted-foreground">
                <Link href="/privacy" className="transition-colors hover:text-foreground">
                  Privacy
                </Link>
                <Link href="/terms" className="transition-colors hover:text-foreground">
                  Terms
                </Link>
                <Link href="/hipaa-notice" className="transition-colors hover:text-foreground">
                  HIPAA Notice
                </Link>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-10 border-t border-border/70 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Symptra Scheduling. All rights reserved. Patients book at{" "}
          <span className="font-mono">/clinic/your-clinic</span> — no account required.
        </p>
      </div>
    </footer>
  );
}
