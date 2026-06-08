"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useReduxForm } from "@/components/common/hooks/useReduxForm";
import { createClient } from "@/lib/supabase/client";

interface SignUpFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function SignUpScreen() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useReduxForm<SignUpFormValues>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const supabase = createClient();

  const onSubmit = form.handleSubmit(async ({ fullName, email, password, confirmPassword }) => {
    setSubmitError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
    setLoading(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    if (data.user && !data.session) {
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      return;
    }

    setSuccessMessage("Account created. Setting up your workspace…");
    setTimeout(() => router.push("/onboarding"), 800);
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join your clinic workspace for AI-powered patient intake and scheduling."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-5">
          <FormField
            control={form.control}
            name="fullName"
            rules={{ required: "Full name is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" placeholder="Dr. Jane Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            rules={{ required: "Email is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work email</FormLabel>
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" placeholder="Min. 8 characters" {...field} />
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
                  <Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {submitError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          ) : null}
          {successMessage ? (
            <p className="status-success text-left">{successMessage}</p>
          ) : null}

          <Button type="submit" className="h-11 w-full text-base shadow-md" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
