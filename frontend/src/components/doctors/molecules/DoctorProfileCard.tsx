import Link from "next/link";
import { CalendarClock, Stethoscope } from "lucide-react";

import type { DoctorProvider } from "@/components/common/store/staffApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DoctorProfileCardProps {
  provider: DoctorProvider | undefined;
}

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  const [hours, minutes] = value.slice(0, 5).split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function DoctorProfileCard({ provider }: DoctorProfileCardProps) {
  return (
    <Card className="hero-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="size-5 text-primary" aria-hidden />
          Clinical profile
        </CardTitle>
        <CardDescription>Specialization and bookable hours shown to patients</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-border/60 pb-3">
          <span className="text-muted-foreground">Display name</span>
          <span className="font-medium">{provider?.display_name ?? "—"}</span>
        </div>
        <div className="flex justify-between gap-4 border-b border-border/60 pb-3">
          <span className="text-muted-foreground">Specialization</span>
          <span className="text-right font-medium">{provider?.specialty ?? "General Practice"}</span>
        </div>
        <div className="flex justify-between gap-4 border-b border-border/60 pb-3">
          <span className="text-muted-foreground">Availability</span>
          <span className="font-medium">
            {formatTime(provider?.availability_start)} – {formatTime(provider?.availability_end)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Slot length</span>
          <span className="font-medium">{provider?.slot_duration_minutes ?? 30} min</span>
        </div>
        <Button variant="outline" size="sm" asChild className="mt-2 w-full sm:w-auto">
          <Link href="/schedule" className="gap-2">
            <CalendarClock className="size-4" aria-hidden />
            Edit schedule
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
