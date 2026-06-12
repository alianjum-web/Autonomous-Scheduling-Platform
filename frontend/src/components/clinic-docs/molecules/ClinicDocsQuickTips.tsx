import Link from "next/link";
import { FileText, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ClinicDocsQuickTips() {
  return (
    <Card className="border-border/70 bg-muted/20">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="size-5" aria-hidden />
          </span>
          <div className="text-sm">
            <p className="font-medium">Power the patient intake chat</p>
            <p className="mt-1 text-muted-foreground">
              Upload FAQ PDFs here, or add clinic hours and services under Settings without a file.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/settings">
            <Settings className="mr-2 size-4" aria-hidden />
            Booking &amp; AI settings
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
