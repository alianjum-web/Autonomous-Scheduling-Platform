"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MarketingCtaSkeleton } from "@/components/platform/atoms/MarketingCtaSkeleton";
import { useMarketingAuthCtas } from "@/components/platform/hooks/useMarketingAuthCtas";
import { Button } from "@/components/ui/button";

export type MarketingCtaVariant = "hero" | "banner" | "pricing";

type CtaAction = {
  href: string;
  label: string;
  showArrow?: boolean;
};

type CtaLayout = "single" | "pair";

function resolveCtaActions(
  variant: MarketingCtaVariant,
  signedIn: boolean,
  dashboardHref: string,
): { layout: CtaLayout; primary: CtaAction; secondary?: CtaAction } {
  if (signedIn) {
    if (variant === "banner") {
      return { layout: "single", primary: { href: dashboardHref, label: "Open dashboard" } };
    }
    if (variant === "hero") {
      return {
        layout: "pair",
        primary: { href: dashboardHref, label: "Go to dashboard", showArrow: true },
        secondary: { href: "/settings", label: "Clinic settings" },
      };
    }
    return {
      layout: "pair",
      primary: { href: dashboardHref, label: "Open dashboard" },
      secondary: { href: "/settings", label: "Settings" },
    };
  }

  if (variant === "banner") {
    return { layout: "single", primary: { href: "/sign-up", label: "Onboard your clinic" } };
  }
  if (variant === "hero") {
    return {
      layout: "pair",
      primary: { href: "/sign-up", label: "Start free trial", showArrow: true },
      secondary: { href: "/sign-in", label: "Staff sign in" },
    };
  }
  return {
    layout: "pair",
    primary: { href: "/sign-up", label: "Start free trial" },
    secondary: { href: "/sign-in", label: "Staff sign in" },
  };
}

function CtaButton({
  action,
  variant,
  size = "lg",
}: {
  action: CtaAction;
  variant: "default" | "outline";
  size?: "default" | "lg";
}) {
  const isHero = size === "lg";
  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={
        variant === "default"
          ? isHero
            ? "h-12 gap-2 px-8 text-base shadow-md"
            : "h-12 px-8 shadow-md"
          : isHero
            ? "h-12 px-8 text-base"
            : "h-12 px-8"
      }
    >
      <Link href={action.href}>
        {action.label}
        {action.showArrow ? <ArrowRight className="size-4" aria-hidden /> : null}
      </Link>
    </Button>
  );
}

export function MarketingCtaGroup({ variant }: { variant: MarketingCtaVariant }) {
  const { session, authReady, dashboardHref } = useMarketingAuthCtas();

  if (!authReady) {
    return <MarketingCtaSkeleton />;
  }

  const { layout, primary, secondary } = resolveCtaActions(variant, Boolean(session), dashboardHref);

  if (layout === "single") {
    return (
      <Button asChild size="lg" className="shadow-md">
        <Link href={primary.href}>{primary.label}</Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <CtaButton action={primary} variant="default" />
      {secondary ? <CtaButton action={secondary} variant="outline" /> : null}
    </div>
  );
}
