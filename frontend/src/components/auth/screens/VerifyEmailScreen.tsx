"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Mail, RefreshCw } from "lucide-react";

import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthSuccessBanner } from "@/components/auth/atoms/AuthSuccessBanner";
import { useAuthEmailCooldown } from "@/components/auth/hooks/useAuthEmailCooldown";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { captureAuthEmailEvent } from "@/lib/auth/captureAuthEmailEvent";
import { AuthEmailApiError, resendVerificationViaApi } from "@/lib/auth/emailApi";

export function VerifyEmailScreen() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { secondsLeft, canSend, startCooldown } = useAuthEmailCooldown("resend", email);

  const handleResend = async () => {
    if (!email) {
      setError("No email address on file. Please sign up again.");
      return;
    }
    if (!canSend) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const successMessage = await resendVerificationViaApi(
        email,
        `${window.location.origin}/auth/callback?next=/onboarding`,
      );
      startCooldown();
      captureAuthEmailEvent("resend", "sent", email);
      setMessage(successMessage);
    } catch (err) {
      if (err instanceof AuthEmailApiError) {
        if (err.retryAfterSeconds > 0) {
          startCooldown(err.retryAfterSeconds);
          captureAuthEmailEvent("resend", "rate_limited", email);
        } else {
          captureAuthEmailEvent("resend", "failed", email);
        }
        setError(err.message);
      } else {
        captureAuthEmailEvent("resend", "failed", email);
        setError("Unable to resend email. Please try again shortly.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resendLabel = loading
    ? "Sending…"
    : secondsLeft > 0
      ? `Resend in ${secondsLeft}s`
      : "Resend confirmation email";

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We sent a confirmation link to complete your account setup."
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="size-8" aria-hidden />
        </div>
        {email ? (
          <p className="text-sm text-muted-foreground">
            Sent to <span className="font-medium text-foreground">{email}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Open the link in your email, then sign in to continue.
          </p>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">
          After confirming, you&apos;ll set up your clinic workspace and can start using patient chat,
          scheduling, and staff tools.
        </p>

        {message ? <AuthSuccessBanner message={message} className="status-success w-full text-left" /> : null}
        {error ? <AuthErrorBanner message={error} /> : null}

        <div className="flex w-full flex-col gap-2">
          <Button
            className="h-11 w-full gap-2 shadow-md"
            onClick={handleResend}
            disabled={loading || !email || !canSend}
          >
            <RefreshCw className="size-4" aria-hidden />
            {resendLabel}
          </Button>
          <Button variant="outline" className="h-11 w-full" asChild>
            <Link href="/sign-in">Back to sign in</Link>
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
