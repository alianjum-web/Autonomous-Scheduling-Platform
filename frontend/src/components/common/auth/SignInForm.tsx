"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AuthLayout } from "@/components/common/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useReduxForm } from "@/components/common/hooks/useReduxForm";
import { createClient } from "@/lib/supabase/client";

interface SignInFormValues {
  email: string;
  password: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_failed: "Authentication failed. Please try signing in again.",
};

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") ?? "/chat";
  const queryError = searchParams.get("error");
  const queryMessage = searchParams.get("message");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const bannerError = queryError
    ? (ERROR_MESSAGES[queryError] ?? "Sign in failed. Please try again.")
    : null;
  const bannerSuccess =
    queryMessage === "password_updated"
      ? "Password updated successfully. You can sign in now."
      : null;

  const form = useReduxForm<SignInFormValues>({ email: "", password: "" });
  const supabase = createClient();

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    setSubmitError(null);
    setSuccessMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access patient intake, staff dashboards, and clinic tools."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            rules={{ required: "Email is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="you@clinic.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            rules={{ required: "Password is required" }}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {(bannerSuccess || successMessage) ? (
            <p className="status-success text-left">{bannerSuccess ?? successMessage}</p>
          ) : null}
          {(bannerError || submitError) ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {bannerError ?? submitError}
            </p>
          ) : null}

          <Button type="submit" className="h-11 w-full text-base shadow-md" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
