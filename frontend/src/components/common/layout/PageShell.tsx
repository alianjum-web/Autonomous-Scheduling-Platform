import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AccessGateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  requireAdmin?: boolean;
  className?: string;
}

export function AccessGate({
  title,
  description,
  icon,
  requireAdmin = false,
  className,
}: AccessGateProps) {
  return (
    <div className={cn("mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center", className)}>
      {icon ? (
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      ) : null}
      <Card className="hero-glow w-full overflow-hidden">
        <CardContent className="space-y-5 p-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="shadow-md">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-up">{requireAdmin ? "Request staff access" : "Create account"}</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {requireAdmin
              ? "Staff accounts require clinic admin role in Supabase app metadata."
              : "Secure Supabase authentication with tenant-scoped JWT claims."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  image,
  imageAlt = "",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-2xl dashboard-card",
        image ? "grid gap-0 lg:grid-cols-[1fr_280px]" : "",
        className,
      )}
    >
      <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</span>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
        {actions ? <div className="mt-2 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {image ? (
        <div className="relative hidden min-h-[140px] lg:block">
          <Image
            src={image}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="280px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/40 to-transparent" />
        </div>
      ) : null}
    </header>
  );
}

interface PageShellProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl" | "full";
}

const maxWidthClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
} as const;

export function PageShell({ children, className, maxWidth = "full" }: PageShellProps) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 sm:px-6", maxWidthClass[maxWidth], className)}>
      {children}
    </div>
  );
}

export function LoadingScreen({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
      <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
