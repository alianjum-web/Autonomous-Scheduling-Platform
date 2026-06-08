import Link from "next/link";
import type { ReactNode } from "react";

import { ClinicalImage } from "@/components/common/atoms/ClinicalImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ImageAssetKey } from "@/lib/constants/images";
import { cn } from "@/lib/utils";

interface AccessGateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  imageKey?: ImageAssetKey;
  requireAdmin?: boolean;
  className?: string;
}

export function AccessGate({
  title,
  description,
  icon,
  imageKey = "team",
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
        <div className="relative h-32 w-full sm:h-36">
          <ClinicalImage asset={imageKey} variant="thumb" className="opacity-90" />
          <div className="absolute inset-0 bg-linear-to-t from-card via-card/50 to-transparent" />
        </div>
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
