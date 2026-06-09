import Link from "next/link";

import { PageShell } from "@/components/common/layout/PageShell";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <PageShell maxWidth="3xl" className="gap-8 pb-20">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="-ml-2 rounded-full">
          <Link href="/">← Back to home</Link>
        </Button>
      </div>

      <PageHeader title={title} description={`Last updated: ${lastUpdated}`} />

      <Card>
        <CardContent className="prose prose-neutral dark:prose-invert max-w-none space-y-6 p-6 text-sm leading-relaxed text-muted-foreground sm:p-8">
          {children}
        </CardContent>
      </Card>
    </PageShell>
  );
}
