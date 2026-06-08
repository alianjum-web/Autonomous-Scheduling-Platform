"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthSubmitButton } from "@/components/auth/atoms/AuthSubmitButton";
import { validatePasswordPair } from "@/components/auth/hooks/validatePasswordPair";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { AuthPasswordField } from "@/components/auth/molecules/AuthPasswordField";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { useReduxForm } from "@/components/common/hooks/useReduxForm";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export function ResetPasswordScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);
  const form = useReduxForm<ResetPasswordFormValues>({ password: "", confirmPassword: "" });
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(!!data.session);
    });
  }, [supabase.auth]);

  const onSubmit = form.handleSubmit(async ({ password, confirmPassword }) => {
    setError(null);
    const passwordError = validatePasswordPair(password, confirmPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/sign-in?message=password_updated");
  });

  if (sessionReady === null) {
    return <LoadingScreen message="Validating reset link…" />;
  }

  if (!sessionReady) {
    return (
      <AuthLayout
        title="Reset link expired"
        subtitle="This password reset link is invalid or has already been used."
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Request a new reset email and open the link within a few minutes.
          </p>
          <Button asChild className="h-11 w-full shadow-md">
            <Link href="/forgot-password">Request new link</Link>
          </Button>
          <Button variant="outline" asChild className="h-11 w-full">
            <Link href="/sign-in">Back to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Enter a strong password for your account.">
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-5">
          <AuthPasswordField
            control={form.control}
            name="password"
            label="New password"
            autoComplete="new-password"
            placeholder=""
          />
          <AuthPasswordField
            control={form.control}
            name="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
            placeholder=""
            rules={{ required: "Please confirm your password" }}
          />
          {error ? <AuthErrorBanner message={error} /> : null}
          <AuthSubmitButton loading={loading} loadingLabel="Updating…">
            Update password
          </AuthSubmitButton>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
