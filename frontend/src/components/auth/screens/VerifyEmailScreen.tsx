"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Mail, RefreshCw } from "lucide-react";

import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function VerifyEmailScreen() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleResend = async () => {
    if (!email) {
      setError("No email address on file. Please sign up again.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    setLoading(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setMessage("Confirmation email sent. Check your inbox and spam folder.");
  };

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
            Sent to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Open the link in your email, then sign in to continue.
          </p>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">
          After confirming, you&apos;ll set up your clinic workspace and can start using patient
          chat, scheduling, and staff tools.
        </p>

        {message ? <p className="status-success w-full text-left">{message}</p> : null}
        {error ? (
          <p className="w-full rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex w-full flex-col gap-2">
          <Button
            className="h-11 w-full gap-2 shadow-md"
            onClick={handleResend}
            disabled={loading || !email}
          >
            <RefreshCw className="size-4" aria-hidden />
            {loading ? "Sending…" : "Resend confirmation email"}
          </Button>
          <Button variant="outline" className="h-11 w-full" asChild>
            <Link href="/sign-in">Back to sign in</Link>
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
