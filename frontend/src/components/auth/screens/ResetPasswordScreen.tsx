"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { LoadingScreen } from "@/components/common/atoms/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useReduxForm } from "@/components/common/hooks/useReduxForm";
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
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
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
          <FormField
            control={form.control}
            name="password"
            rules={{ required: "Password is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            rules={{ required: "Please confirm your password" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
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
            {loading ? "Updating…" : "Update password"}
          </Button>
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
