"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import {
  useGetCalendarConfigQuery,
  useUpdateCalendarConfigMutation,
} from "@/components/patient-triage/store/bookingApi";
import { showToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CalendarConfigResponse, CalendarConfigUpdateRequest } from "@/types/schedule";

function configToForm(config: CalendarConfigResponse): CalendarConfigUpdateRequest {
  return {
    timezone: config.timezone,
    calendar_provider: config.google_connected ? "google" : config.uses_mock_slots ? "mock" : "none",
    google_calendar_id: config.google_calendar_id,
    business_hours_start: config.business_hours_start,
    business_hours_end: config.business_hours_end,
    slot_duration_minutes: config.slot_duration_minutes,
  };
}

export function CalendarConfigPanel() {
  const { data: config, isLoading } = useGetCalendarConfigQuery();
  const [updateConfig, { isLoading: saving }] = useUpdateCalendarConfigMutation();
  const [draft, setDraft] = useState<CalendarConfigUpdateRequest | null>(null);
  const form = draft ?? (config ? configToForm(config) : null);

  const handleSave = async () => {
    if (!form) return;
    try {
      await updateConfig(form).unwrap();
      setDraft(null);
      showToast({
        title: "Calendar settings saved",
        description: form.calendar_provider === "google"
          ? "Slots will use Google Calendar free/busy when credentials are configured."
          : "Using generated clinic hours until Google is connected.",
      });
    } catch {
      showToast({
        title: "Could not save calendar settings",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-5 text-primary" aria-hidden />
          Calendar & availability
        </CardTitle>
        <CardDescription>
          Connect your clinic calendar so AI chat shows real open slots. Share the calendar with
          your platform Google service account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {isLoading || !form ? (
          <p className="text-muted-foreground">Loading calendar config…</p>
        ) : (
          <>
            <div className="grid gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Status</span>
                <span>
                  {config?.google_connected
                    ? "Google Calendar connected"
                    : config?.uses_mock_slots
                      ? "Mock slots (clinic hours)"
                      : "Not configured"}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={form.timezone}
                  onChange={(e) => setDraft({ ...form, timezone: e.target.value })}
                  placeholder="America/New_York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="google_calendar_id">Google Calendar ID</Label>
                <Input
                  id="google_calendar_id"
                  value={form.google_calendar_id ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...form,
                      google_calendar_id: e.target.value || null,
                      calendar_provider: e.target.value ? "google" : "mock",
                    })
                  }
                  placeholder="clinic@group.calendar.google.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours_start">Business hours start</Label>
                <Input
                  id="hours_start"
                  type="number"
                  min={0}
                  max={23}
                  value={form.business_hours_start}
                  onChange={(e) =>
                    setDraft({ ...form, business_hours_start: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours_end">Business hours end</Label>
                <Input
                  id="hours_end"
                  type="number"
                  min={1}
                  max={24}
                  value={form.business_hours_end}
                  onChange={(e) =>
                    setDraft({ ...form, business_hours_end: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="slot_duration">Appointment length (minutes)</Label>
                <Input
                  id="slot_duration"
                  type="number"
                  min={15}
                  max={120}
                  step={15}
                  value={form.slot_duration_minutes}
                  onChange={(e) =>
                    setDraft({ ...form, slot_duration_minutes: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Saving…" : "Save calendar settings"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
