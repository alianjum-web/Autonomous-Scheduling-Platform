"use client";

import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ClinicSetupRequiredCardProps {
  isOwner: boolean;
}

export function ClinicSetupRequiredCard({ isOwner }: ClinicSetupRequiredCardProps) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-5 text-primary" aria-hidden />
          Set up your clinic workspace
        </CardTitle>
        <CardDescription>
          {isOwner
            ? "Create your clinic to unlock the public booking page, calendar, and patient intake."
            : "Your account is not linked to a clinic yet. Complete owner setup or ask your clinic owner to invite you."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href="/onboarding">
            {isOwner ? "Create clinic workspace" : "Set up as clinic owner"}
            <ArrowRight className="ml-2 size-4" aria-hidden />
          </Link>
        </Button>
        {!isOwner ? (
          <p className="text-xs text-muted-foreground">
            Front-desk staff are added by invite. If you already have an invite link, open it to join
            your clinic.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
