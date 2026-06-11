"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import {
  useGetMyProviderQuery,
  useUpdateMyAvailabilityMutation,
} from "@/components/common/store/staffApi";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { PageShell } from "@/components/common/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/toast";

export function DoctorScheduleScreen() {
  const { isDoctor, loading } = useRoleGuard();
  const { session } = useAuthSession();
  const { data: provider, isLoading: providerLoading } = useGetMyProviderQuery(undefined, {
    skip: !isDoctor,
  });
  const [updateAvailability, { isLoading: saving }] = useUpdateMyAvailabilityMutation();
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [slotMinutes, setSlotMinutes] = useState(30);

  useEffect(() => {
    if (provider) {
      setStart(provider.availability_start.slice(0, 5));
      setEnd(provider.availability_end.slice(0, 5));
      setSlotMinutes(provider.slot_duration_minutes);
    }
  }, [provider]);

  if (loading || providerLoading) return <LoadingScreen message="Loading schedule…" />;

  if (!session || !isDoctor) {
    return (
      <AccessGate
        title="Doctor schedule"
        description="Set your availability and slot length here."
        icon={<CalendarDays className="size-8" />}
        imageKey="frontDesk"
        signedIn={Boolean(session)}
      />
    );
  }

  const handleSave = async () => {
    try {
      await updateAvailability({
        availability_start: start,
        availability_end: end,
        slot_duration_minutes: slotMinutes,
      }).unwrap();
      showToast({ title: "Availability saved", description: "Patients can book during these hours." });
    } catch {
      showToast({ title: "Could not save availability", variant: "destructive" });
    }
  };

  return (
    <PageShell maxWidth="2xl" className="gap-8 pb-12">
      <PageHeader
        eyebrow="Doctor"
        title="My schedule"
        description="Configure when you accept appointments. Owner connects clinic-wide calendar in Settings."
        imageKey="frontDesk"
      />

      <Card>
        <CardHeader>
          <CardTitle>Weekly availability</CardTitle>
          <CardDescription>Default hours used for your appointment slots</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="avail-start">Start time</Label>
            <Input
              id="avail-start"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avail-end">End time</Label>
            <Input id="avail-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slot-min">Slot length (minutes)</Label>
            <Input
              id="slot-min"
              type="number"
              min={15}
              max={120}
              step={15}
              value={slotMinutes}
              onChange={(e) => setSlotMinutes(Number(e.target.value))}
            />
          </div>
          <div className="sm:col-span-3">
            <Button disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving…" : "Save availability"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
