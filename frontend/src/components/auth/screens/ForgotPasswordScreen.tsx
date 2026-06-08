"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthSubmitButton } from "@/components/auth/atoms/AuthSubmitButton";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { AuthEmailField } from "@/components/auth/molecules/AuthEmailField";
import { useReduxForm } from "@/components/common/hooks/useReduxForm";
import { Form } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";

interface ForgotPasswordFormValues {
  email: string;
}

export function ForgotPasswordScreen() {
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
            <AuthEmailField control={form.control} name="email" />
            {error ? <AuthErrorBanner message={error} /> : null}
            <AuthSubmitButton loading={loading} loadingLabel="Sending…">
              Send reset link
            </AuthSubmitButton>
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
