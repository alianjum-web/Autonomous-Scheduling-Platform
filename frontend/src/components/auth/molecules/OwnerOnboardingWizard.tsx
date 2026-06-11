"use client";

import Link from "next/link";

import { AuthBackButton } from "@/components/auth/atoms/AuthBackButton";
import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthSubmitButton } from "@/components/auth/atoms/AuthSubmitButton";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import type { useOwnerOnboarding } from "@/components/auth/hooks/useOwnerOnboarding";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type OwnerOnboardingWizardProps = ReturnType<typeof useOwnerOnboarding>;

export function OwnerOnboardingWizard({
  step,
  form,
  submitError,
  submitting,
  tenantSlug,
  clinicTypes,
  nextStep,
  prevStep,
}: OwnerOnboardingWizardProps) {
  if (step === "welcome") {
    return (
      <AuthLayout
        title="Welcome to Symptra"
        subtitle="Set up your clinic workspace. This flow is for clinic owners only."
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>You will create your clinic, configure basics, and optionally invite doctors.</p>
          <p>
            Doctor?{" "}
            <Link href="/sign-in" className="text-primary hover:underline">
              Use your invitation link
            </Link>{" "}
            — do not use owner sign-up.
          </p>
          <p>
            Patient?{" "}
            <Link href="/book/harbor-medical-group" className="text-primary hover:underline">
              Book without an account
            </Link>
            .
          </p>
        </div>
        <AuthSubmitButton loading={false} loadingLabel="" onClick={() => void nextStep()}>
          Get started
        </AuthSubmitButton>
      </AuthLayout>
    );
  }

  if (step === "clinic") {
    return (
      <AuthLayout title="Clinic name" subtitle="Your public booking page will use this URL slug.">
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void nextStep();
            }}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="clinicName"
              rules={{ required: "Clinic name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinic name</FormLabel>
                  <FormControl>
                    <Input placeholder="Harbor Medical Group" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clinicSlug"
              rules={{ required: "Booking URL is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Public booking URL</FormLabel>
                  <FormControl>
                    <div className="flex items-center rounded-md border border-input bg-background shadow-xs">
                      <span className="px-3 text-sm text-muted-foreground">/book/</span>
                      <Input className="border-0 shadow-none focus-visible:ring-0" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {submitError ? <AuthErrorBanner message={submitError} /> : null}
            <AuthSubmitButton loading={submitting} loadingLabel="Creating clinic…">
              Continue
            </AuthSubmitButton>
            <AuthBackButton onClick={prevStep} />
          </form>
        </Form>
      </AuthLayout>
    );
  }

  if (step === "clinic-type") {
    return (
      <AuthLayout title="Clinic type" subtitle="Helps us tailor AI triage defaults.">
        <div className="space-y-4">
          <Label htmlFor="clinic-type">What type of clinic is this?</Label>
          <select
            id="clinic-type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.watch("clinicType")}
            onChange={(e) => form.setValue("clinicType", e.target.value)}
          >
            {clinicTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <AuthSubmitButton loading={false} loadingLabel="" onClick={() => void nextStep()}>
            Continue
          </AuthSubmitButton>
          <AuthBackButton onClick={prevStep} />
        </div>
      </AuthLayout>
    );
  }

  if (step === "team-size") {
    return (
      <AuthLayout title="Team size" subtitle="How many doctors will use Symptra?">
        <div className="space-y-4">
          <Label htmlFor="doctor-count">How many doctors will use Symptra?</Label>
          <select
            id="doctor-count"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.watch("doctorCount")}
            onChange={(e) => form.setValue("doctorCount", e.target.value)}
          >
            {["1-3", "4-10", "11-25", "26+"].map((n) => (
              <option key={n} value={n}>
                {n} doctors
              </option>
            ))}
          </select>
          <AuthSubmitButton loading={false} loadingLabel="" onClick={() => void nextStep()}>
            Continue
          </AuthSubmitButton>
          <AuthBackButton onClick={prevStep} />
        </div>
      </AuthLayout>
    );
  }

  if (step === "invite") {
    return (
      <AuthLayout
        title="Invite doctors"
        subtitle="Optional — you can invite from the Doctors page anytime."
      >
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="dr.smith@yourclinic.com"
            value={form.watch("inviteEmail")}
            onChange={(e) => form.setValue("inviteEmail", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Skip for now and invite later from{" "}
            <Link href="/doctors" className="text-primary hover:underline">
              Doctors
            </Link>
            .
          </p>
          {submitError ? <AuthErrorBanner message={submitError} /> : null}
          <AuthSubmitButton loading={submitting} loadingLabel="Sending invite…" onClick={() => void nextStep()}>
            {form.watch("inviteEmail").trim() ? "Send invite & continue" : "Skip for now"}
          </AuthSubmitButton>
          <AuthBackButton onClick={prevStep} />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="You're all set" subtitle="Your clinic workspace is ready.">
      <div className="space-y-4 text-sm">
        {tenantSlug ? (
          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2">
            Patient booking:{" "}
            <Link href={`/book/${tenantSlug}`} className="font-medium text-primary hover:underline">
              /book/{tenantSlug}
            </Link>
          </p>
        ) : null}
        <p className="text-muted-foreground">
          Publish your booking page and invite doctors from the dashboard.
        </p>
        <AuthSubmitButton loading={submitting} loadingLabel="Opening dashboard…" onClick={() => void nextStep()}>
          Go to dashboard
        </AuthSubmitButton>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/doctors">Invite doctors now</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
