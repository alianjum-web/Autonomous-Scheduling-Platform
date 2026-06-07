"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

import { DashboardSidebar } from "@/components/common/layout/DashboardSidebar";
import { DashboardTopbar } from "@/components/common/layout/DashboardTopbar";
import { MarketingShell } from "@/components/common/layout/MarketingShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MARKETING_ROUTES = new Set(["/", "/privacy", "/terms", "/hipaa-notice", "/help", "/status"]);

function isMarketingRoute(pathname: string) {
  return MARKETING_ROUTES.has(pathname);
}

export function PlatformChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNav, setMobileNav] = useState(false);

  if (isMarketingRoute(pathname)) {
    return <MarketingShell>{children}</MarketingShell>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex">
        <DashboardSidebar />
      </div>

      {mobileNav ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMobileNav(false)}
          />
          <div className="relative h-full w-[260px] shadow-xl">
            <DashboardSidebar />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-3 size-9 rounded-xl"
              onClick={() => setMobileNav(false)}
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border/60 bg-card/80 px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl"
            aria-label="Open menu"
            onClick={() => setMobileNav(true)}
          >
            <Menu className="size-5" />
          </Button>
          <span className="text-sm font-semibold">Symptra</span>
        </div>
        <DashboardTopbar />
        <main className={cn("flex-1 overflow-auto")}>{children}</main>
      </div>
    </div>
  );
}
