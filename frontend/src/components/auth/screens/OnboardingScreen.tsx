"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, UserCircle } from "lucide-react";

import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthSubmitButton } from "@/components/auth/atoms/AuthSubmitButton";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLocalForm } from "@/components/common/hooks/useLocalForm";
import { completeOnboarding, slugifyClinicName } from "@/lib/supabase/onboarding";

interface OnboardingFormValues {
  clinicName: string;
  clinicSlug: string;
  role: "patient" | "clinic_admin";
}

export function OnboardingScreen() {
  const router = useRouter();
  const { session, loading, tenantId } = useAuthSession();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useLocalForm<OnboardingFormValues>({
    clinicName: "",
    clinicSlug: "",
    role: "patient",
  });

  const clinicName = form.watch("clinicName");

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/sign-in?next=/onboarding");
    }
  }, [loading, session, router]);

  useEffect(() => {
    if (tenantId) {
      router.replace("/chat");
    }
  }, [tenantId, router]);

  useEffect(() => {
    if (clinicName) {
      form.setValue("clinicSlug", slugifyClinicName(clinicName));
    }
  }, [clinicName, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await completeOnboarding({
        clinicName: values.clinicName,
        clinicSlug: values.clinicSlug,
        role: values.role,
      });
      router.push("/chat");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Onboarding failed.");
    } finally {
      setSubmitting(false);
    }
  });

  if (loading || tenantId) {
    return null;
  }

  return (
    <AuthLayout
      title="Set up your clinic workspace"
      subtitle="Create your organization profile so patient intake, scheduling, and staff tools are tenant-isolated and secure."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-5">
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
            rules={{ required: "Workspace URL is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workspace URL</FormLabel>
                <FormControl>
                  <div className="flex items-center rounded-md border border-input bg-background shadow-xs">
                    <span className="px-3 text-sm text-muted-foreground">clinic/</span>
                    <Input className="border-0 shadow-none focus-visible:ring-0" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your role</FormLabel>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        value: "patient" as const,
                        label: "Patient",
                        desc: "Book appointments via AI chat",
                        icon: UserCircle,
                      },
                      {
                        value: "clinic_admin" as const,
                        label: "Clinic staff",
                        desc: "Front desk, docs & scheduling",
                        icon: Building2,
                      },
                    ] as const
                  ).map(({ value, label, desc, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field.onChange(value)}
                      className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
                        field.value === value
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <Icon className="size-5 text-primary" aria-hidden />
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">{desc}</span>
                    </button>
                  ))}
                </div>
              </FormItem>
            )}
          />

          {submitError ? <AuthErrorBanner message={submitError} /> : null}

          <AuthSubmitButton loading={submitting} loadingLabel="Creating workspace…">
            Complete setup
          </AuthSubmitButton>
        </form>
      </Form>

      <p className="text-center text-xs text-muted-foreground">
        By continuing you agree to our{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthLayout>
  );
}
