import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/common/layout/PageShell";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <PageShell maxWidth="2xl" className="prose prose-neutral dark:prose-invert max-w-none pb-16">
      <div className="not-prose mb-8 space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/">← Back to home</Link>
        </Button>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      </div>
      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </PageShell>
  );
}
