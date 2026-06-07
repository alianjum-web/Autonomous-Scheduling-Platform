"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthLayout } from "@/components/common/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useReduxForm } from "@/components/common/hooks/useReduxForm";
import { createClient } from "@/lib/supabase/client";

interface ForgotPasswordFormValues {
  email: string;
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const form = useReduxForm<ForgotPasswordFormValues>({ email: "" });
  const supabase = createClient();

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setError(null);
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  });

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send a secure link to choose a new password."
    >
      {sent ? (
        <div className="status-success text-left">
          Check your inbox for a password reset link. It may take a minute to arrive.
        </div>
      ) : (
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
            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="h-11 w-full shadow-md" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </Form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
