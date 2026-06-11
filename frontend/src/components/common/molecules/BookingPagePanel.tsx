"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/components/ui/toast";
import {
  useGetBookingPageQuery,
  useUpdateBookingPageMutation,
} from "@/components/patient-triage/store/bookingApi";

export function BookingPagePanel() {
  const { data, isLoading } = useGetBookingPageQuery();
  const [updateBookingPage, { isLoading: saving }] = useUpdateBookingPageMutation();
  const [welcomeMessage, setWelcomeMessage] = useState("");

  const enabled = data?.enabled ?? false;
  const publicUrl = data?.public_url ?? null;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading booking page settings…</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public booking page</CardTitle>
        <CardDescription>
          Patients visit this URL — no workspace account. They complete intake, AI triage, and book
          appointments. Staff receive requests in Front Desk.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-4">
          <div>
            <p className="font-medium">Publish booking page</p>
            <p className="text-xs text-muted-foreground">Requires BAA signed before patients can use AI triage.</p>
          </div>
          <Button
            variant={enabled ? "default" : "outline"}
            disabled={saving}
            onClick={async () => {
              const next = !enabled;
              try {
                await updateBookingPage({
                  enabled: next,
                  welcome_message: welcomeMessage || data?.welcome_message || null,
                }).unwrap();
                showToast({
                  title: next ? "Booking page published" : "Booking page hidden",
                  description: next
                    ? "Share the public URL with patients."
                    : "Patients can no longer start new visits.",
                });
              } catch {
                showToast({
                  title: "Update failed",
                  description: "Only clinic admins can publish the booking page.",
                  variant: "destructive",
                });
              }
            }}
          >
            {enabled ? "Published" : "Publish"}
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcome">Welcome message (optional)</Label>
          <Textarea
            id="welcome"
            rows={3}
            defaultValue={data?.welcome_message ?? ""}
            placeholder="Welcome to Harbor Medical — book online in minutes."
            onChange={(e) => setWelcomeMessage(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={async () => {
              try {
                await updateBookingPage({
                  enabled,
                  welcome_message: welcomeMessage || null,
                }).unwrap();
                showToast({ title: "Welcome message saved" });
              } catch {
                showToast({ title: "Save failed", variant: "destructive" });
              }
            }}
          >
            Save message
          </Button>
        </div>

        {publicUrl ? (
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-medium text-foreground">Patient URL</p>
            <code className="mt-2 block break-all text-xs">{publicUrl}</code>
            <Button
              className="mt-3"
              size="sm"
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(publicUrl);
                showToast({ title: "Link copied" });
              }}
            >
              Copy link
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
