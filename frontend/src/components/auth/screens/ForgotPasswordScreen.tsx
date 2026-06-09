"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthSubmitButton } from "@/components/auth/atoms/AuthSubmitButton";
import { useAuthEmailCooldown } from "@/components/auth/hooks/useAuthEmailCooldown";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { AuthEmailField } from "@/components/auth/molecules/AuthEmailField";
import { useLocalForm } from "@/components/common/hooks/useLocalForm";
import { Form } from "@/components/ui/form";
import { captureAuthEmailEvent } from "@/lib/auth/captureAuthEmailEvent";
import { AuthEmailApiError, forgotPasswordViaApi } from "@/lib/auth/emailApi";

interface ForgotPasswordFormValues {
  email: string;
}

export function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const form = useLocalForm<ForgotPasswordFormValues>({ email: "" });
  const email = form.watch("email");
  const { secondsLeft, canSend, startCooldown } = useAuthEmailCooldown("recover", email);

  const onSubmit = form.handleSubmit(async ({ email: submittedEmail }) => {
    if (!canSend) return;

    setError(null);
    setLoading(true);

    try {
      await forgotPasswordViaApi(
        submittedEmail,
        `${window.location.origin}/auth/callback?next=/reset-password`,
      );
      startCooldown();
      captureAuthEmailEvent("recover", "sent", submittedEmail);
      setSent(true);
    } catch (err) {
      if (err instanceof AuthEmailApiError) {
        if (err.retryAfterSeconds > 0) {
          startCooldown(err.retryAfterSeconds);
          captureAuthEmailEvent("recover", "rate_limited", submittedEmail);
        } else {
          captureAuthEmailEvent("recover", "failed", submittedEmail);
        }
        setError(err.message);
      } else {
        captureAuthEmailEvent("recover", "failed", submittedEmail);
        setError("Unable to send reset email. Please try again shortly.");
      }
    } finally {
      setLoading(false);
    }
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
            <AuthSubmitButton
              loading={loading}
              loadingLabel="Sending…"
              disabled={!canSend}
            >
              {secondsLeft > 0 ? `Send again in ${secondsLeft}s` : "Send reset link"}
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
