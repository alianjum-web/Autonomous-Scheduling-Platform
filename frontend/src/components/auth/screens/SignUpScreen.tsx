"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthSubmitButton } from "@/components/auth/atoms/AuthSubmitButton";
import { AuthSuccessBanner } from "@/components/auth/atoms/AuthSuccessBanner";
import { useAuthSubmitState } from "@/components/auth/hooks/useAuthSubmitState";
import { validatePasswordPair } from "@/components/auth/hooks/validatePasswordPair";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { AuthEmailField } from "@/components/auth/molecules/AuthEmailField";
import { AuthPasswordField } from "@/components/auth/molecules/AuthPasswordField";
import { useReduxForm } from "@/components/common/hooks/useReduxForm";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface SignUpFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function SignUpScreen() {
  const router = useRouter();
  const { submitError, setSubmitError, successMessage, setSuccessMessage, loading, setLoading, clearMessages } =
    useAuthSubmitState();

  const form = useReduxForm<SignUpFormValues>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const supabase = createClient();

  const onSubmit = form.handleSubmit(async ({ fullName, email, password, confirmPassword }) => {
    clearMessages();

    const passwordError = validatePasswordPair(password, confirmPassword);
    if (passwordError) {
      setSubmitError(passwordError);
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
          <AuthEmailField control={form.control} name="email" label="Work email" />
          <AuthPasswordField
            control={form.control}
            name="password"
            label="Password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
          />
          <AuthPasswordField
            control={form.control}
            name="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
            rules={{ required: "Please confirm your password" }}
          />

          {submitError ? <AuthErrorBanner message={submitError} /> : null}
          {successMessage ? <AuthSuccessBanner message={successMessage} /> : null}

          <AuthSubmitButton loading={loading} loadingLabel="Creating account…">
            Create account
          </AuthSubmitButton>
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
