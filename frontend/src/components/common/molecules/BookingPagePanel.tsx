"use client";

import { useState } from "react";
import Link from "next/link";

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
  const [welcomeDraft, setWelcomeDraft] = useState<string | null>(null);
  const [hoursDraft, setHoursDraft] = useState<string | null>(null);
  const [servicesDraft, setServicesDraft] = useState<string | null>(null);

  const enabled = data?.enabled ?? false;
  const publicUrl = data?.public_url ?? null;
  const welcomeMessage = welcomeDraft ?? data?.welcome_message ?? "";
  const clinicHours = hoursDraft ?? data?.clinic_hours_info ?? "";
  const clinicServices = servicesDraft ?? data?.clinic_services ?? "";

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading booking page settings…</p>;
  }

  const saveAiKnowledge = async () => {
    try {
      await updateBookingPage({
        enabled,
        welcome_message: welcomeMessage || null,
        clinic_hours_info: clinicHours || null,
        clinic_services: clinicServices || null,
      }).unwrap();
      setWelcomeDraft(null);
      setHoursDraft(null);
      setServicesDraft(null);
      showToast({
        title: "AI knowledge saved",
        description: "The intake assistant will use these details when patients ask questions.",
      });
    } catch {
      showToast({ title: "Save failed", variant: "destructive" });
    }
  };

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
        <div className="flex flex-col gap-4 rounded-lg border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Publish booking page</p>
            <p className="text-xs text-muted-foreground">
              {enabled
                ? "Patients can book at your public clinic URL."
                : "Turn this on so patients can visit your clinic page and book without an account."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              BAA must be signed before patients can use AI triage.
            </p>
          </div>
          <Button
            className="shrink-0"
            variant={enabled ? "default" : "outline"}
            disabled={saving}
            onClick={async () => {
              const next = !enabled;
              try {
                await updateBookingPage({
                  enabled: next,
                  welcome_message: welcomeMessage || null,
                  clinic_hours_info: clinicHours || null,
                  clinic_services: clinicServices || null,
                }).unwrap();
                setWelcomeDraft(null);
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
            value={welcomeMessage}
            placeholder="Welcome to Harbor Medical — book online in minutes."
            onChange={(e) => setWelcomeDraft(e.target.value)}
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
                  clinic_hours_info: clinicHours || null,
                  clinic_services: clinicServices || null,
                }).unwrap();
                setWelcomeDraft(null);
                showToast({ title: "Welcome message saved" });
              } catch {
                showToast({ title: "Save failed", variant: "destructive" });
              }
            }}
          >
            Save message
          </Button>
        </div>

        <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div>
            <p className="font-medium">AI intake assistant knowledge</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Patients often ask about clinic hours, services, and tests (e.g. blood group tests).
              Add the facts here so the chat can answer like your front desk. You can also upload
              FAQ PDFs under{" "}
              <Link href="/clinic-docs" className="text-primary underline-offset-2 hover:underline">
                Clinic Docs
              </Link>
              .
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic-hours">Clinic hours</Label>
            <Textarea
              id="clinic-hours"
              rows={2}
              value={clinicHours}
              placeholder="Mon–Sat 9:00 AM – 8:00 PM. Closed Sundays and public holidays."
              onChange={(e) => setHoursDraft(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic-services">Services offered</Label>
            <Textarea
              id="clinic-services"
              rows={4}
              value={clinicServices}
              placeholder="Dental checkups, teeth cleaning, root canal, blood group test, CBC, X-ray, …"
              onChange={(e) => setServicesDraft(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              List what you offer and what you do not (e.g. &quot;We do not offer MRI on-site&quot;).
            </p>
          </div>
          <Button variant="secondary" size="sm" disabled={saving} onClick={() => void saveAiKnowledge()}>
            Save AI knowledge
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
