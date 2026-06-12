import type { DoctorProvider } from "@/components/common/store/staffApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

interface WeeklyAvailabilitySummaryProps {
  provider: DoctorProvider | undefined;
}

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  const [hours, minutes] = value.slice(0, 5).split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function WeeklyAvailabilitySummary({ provider }: WeeklyAvailabilitySummaryProps) {
  const start = formatTime(provider?.availability_start);
  const end = formatTime(provider?.availability_end);
  const hoursLabel = `${start} – ${end}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly overview</CardTitle>
        <CardDescription>
          Default bookable hours. Patients cannot book outside these times.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
          >
            <span className="font-medium">{day}</span>
            <span className="text-muted-foreground">{hoursLabel}</span>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-lg border border-dashed border-border/60 px-3 py-2 text-muted-foreground">
          <span>Saturday</span>
          <span>Off</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-dashed border-border/60 px-3 py-2 text-muted-foreground">
          <span>Sunday</span>
          <span>Off</span>
        </div>
        <p className="pt-2 text-xs text-muted-foreground">
          Per-day leave and block-time controls are coming soon. For now, adjust your default hours
          below or ask your clinic owner to cancel specific appointments.
        </p>
      </CardContent>
    </Card>
  );
}
