"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  selectDefaultHome,
  selectIsDoctor,
} from "@/components/auth/store/authSelectors";
import { ClinicalImage } from "@/components/common/atoms/ClinicalImage";
import { useAppSelector } from "@/components/common/store/hooks";
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
  /** When true, user is signed in but lacks permission — hide redundant Sign in CTA. */
  signedIn?: boolean;
  className?: string;
}

export function AccessGate({
  title,
  description,
  icon,
  imageKey = "team",
  requireAdmin = false,
  signedIn = false,
  className,
}: AccessGateProps) {
  const dashboardHref = useAppSelector(selectDefaultHome);
  const isDoctor = useAppSelector(selectIsDoctor);

  return (
    <div className={cn("mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center", className)}>
      {icon ? (
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      ) : null}
      <Card className="hero-glow w-full overflow-hidden">
        <div className="relative h-32 w-full sm:h-36">
          <ClinicalImage asset={imageKey} variant="thumb" className="opacity-90" priority />
          <div className="absolute inset-0 bg-linear-to-t from-card via-card/50 to-transparent" />
        </div>
        <CardContent className="space-y-5 p-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {signedIn ? (
              <>
                <Button asChild size="lg" className="shadow-md">
                  <Link href={dashboardHref}>Go to dashboard</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/help">Staff access guide</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" className="shadow-md">
                  <Link href="/sign-in">Staff sign in</Link>
                </Button>
                {requireAdmin ? (
                  <Button asChild variant="outline" size="lg">
                    <Link href="/accept-invite">I have an invite</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="lg">
                    <Link href="/sign-up">Start your clinic</Link>
                  </Button>
                )}
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {signedIn && requireAdmin
              ? isDoctor
                ? "You are signed in as a doctor — use your doctor dashboard, not the owner overview."
                : "Only clinic owners can access this area. Ask your owner for an invite if you need staff access."
              : requireAdmin
                ? "Doctors and staff join via invitation. Patients book at /clinic/your-clinic without signing up."
                : "Staff sign-in only. Patients use the public clinic booking page — no account required."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
