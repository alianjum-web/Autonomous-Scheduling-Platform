"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthSubmitButton } from "@/components/auth/atoms/AuthSubmitButton";
import { useAuthEmailCooldown } from "@/components/auth/hooks/useAuthEmailCooldown";
import { useAuthSubmitState } from "@/components/auth/hooks/useAuthSubmitState";
import { validatePasswordPair } from "@/components/auth/hooks/validatePasswordPair";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { AuthEmailField } from "@/components/auth/molecules/AuthEmailField";
import { AuthPasswordField } from "@/components/auth/molecules/AuthPasswordField";
import { useLocalForm } from "@/components/common/hooks/useLocalForm";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { captureAuthEmailEvent } from "@/lib/auth/captureAuthEmailEvent";
import { AuthEmailApiError, signUpViaApi } from "@/lib/auth/emailApi";

interface SignUpFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function SignUpScreen() {
  const router = useRouter();
  const { submitError, setSubmitError, loading, setLoading, clearMessages } = useAuthSubmitState();

  const form = useLocalForm<SignUpFormValues>({
    fullName: "Anjum",
    email: "muhammadaliabbas7890@gmail.com",
    password: "12345678",
    confirmPassword: "12345678",
  });
  const email = form.watch("email");
  const { secondsLeft, canSend, startCooldown } = useAuthEmailCooldown("signup", email);

  const onSubmit = form.handleSubmit(async ({ fullName, email: submittedEmail, password, confirmPassword }) => {
    if (!canSend) return;
    clearMessages();

    const passwordError = validatePasswordPair(password, confirmPassword);
    if (passwordError) {
      setSubmitError(passwordError);
      return;
    }

    setLoading(true);
    try {
      await signUpViaApi({
        email: submittedEmail,
        password,
        fullName,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      });
      startCooldown();
      captureAuthEmailEvent("signup", "sent", submittedEmail);
      router.push(`/verify-email?email=${encodeURIComponent(submittedEmail)}`);
    } catch (err) {
      if (err instanceof AuthEmailApiError) {
        if (err.retryAfterSeconds > 0) {
          startCooldown(err.retryAfterSeconds);
          captureAuthEmailEvent("signup", "rate_limited", submittedEmail);
        } else {
          captureAuthEmailEvent("signup", "failed", submittedEmail);
        }
        setSubmitError(err.message);
      } else {
        captureAuthEmailEvent("signup", "failed", submittedEmail);
        setSubmitError(
          "Unable to reach the API. Check NEXT_PUBLIC_API_URL and that the backend is running.",
        );
      }
    } finally {
      setLoading(false);
    }
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

          <AuthSubmitButton loading={loading} loadingLabel="Creating account…" disabled={!canSend}>
            {secondsLeft > 0 ? `Try again in ${secondsLeft}s` : "Create account"}
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
