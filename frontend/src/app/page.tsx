import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <div className="max-w-lg text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Autonomous Scheduling Platform</h1>
        <p className="mt-3 text-muted-foreground">
          HIPAA-aware, multi-tenant patient intake with streaming AI triage.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/chat">Open Patient Chat</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/clinic-docs">Clinic Documents</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/front-desk">Front Desk</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/appointments">Appointments</Link>
        </Button>
      </div>
    </div>
  );
}
