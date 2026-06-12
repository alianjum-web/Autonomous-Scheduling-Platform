"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthSubmitButton } from "@/components/auth/atoms/AuthSubmitButton";
import { useAuthSubmitState } from "@/components/auth/hooks/useAuthSubmitState";
import { validatePasswordPair } from "@/components/auth/hooks/validatePasswordPair";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { AuthEmailField } from "@/components/auth/molecules/AuthEmailField";
import { AuthPasswordField } from "@/components/auth/molecules/AuthPasswordField";
import { usePreviewStaffInviteQuery } from "@/components/common/store/staffApi";
import { useLocalForm } from "@/components/common/hooks/useLocalForm";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { captureAuthEmailEvent } from "@/lib/auth/captureAuthEmailEvent";
import { AuthEmailApiError, signUpViaApi } from "@/lib/auth/emailApi";

interface SignUpFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") ?? "";
  const nextPath = searchParams.get("next") ?? "/onboarding";
  const isStaffInvite = Boolean(inviteToken);
  const { data: invitePreview, isLoading: previewLoading } = usePreviewStaffInviteQuery(inviteToken, {
    skip: !inviteToken,
  });
  const inviteRole = invitePreview?.role;
  const { submitError, setSubmitError, loading, setLoading, clearMessages } = useAuthSubmitState();

  const form = useLocalForm<SignUpFormValues>({
    fullName: "",
    email: invitePreview?.email ?? "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (invitePreview?.email) {
      form.setValue("email", invitePreview.email);
    }
  }, [invitePreview?.email, form]);

  const onSubmit = form.handleSubmit(async ({ fullName, email: submittedEmail, password, confirmPassword }) => {
    clearMessages();

    const passwordError = validatePasswordPair(password, confirmPassword);
    if (passwordError) {
      setSubmitError(passwordError);
      return;
    }

    setLoading(true);
    try {
      const redirectNext = isStaffInvite
        ? nextPath || `/accept-invite?token=${inviteToken}`
        : "/onboarding";
      await signUpViaApi({
        email: submittedEmail,
        password,
        fullName,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectNext)}`,
      });
      captureAuthEmailEvent("signup", "sent", submittedEmail);
      router.push(`/verify-email?email=${encodeURIComponent(submittedEmail)}`);
    } catch (err) {
      if (err instanceof AuthEmailApiError) {
        captureAuthEmailEvent("signup", err.retryAfterSeconds > 0 ? "rate_limited" : "failed", submittedEmail);
        setSubmitError(err.message);
      } else {
        captureAuthEmailEvent("signup", "failed", submittedEmail);
        setSubmitError(err instanceof Error ? err.message : "Unable to reach the API. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  });

  if (isStaffInvite && previewLoading) {
    return <LoadingScreen message="Loading invitation…" />;
  }

  const staffInviteTitle =
    inviteRole === "doctor"
      ? "Create your doctor account"
      : inviteRole === "clinic_admin"
        ? "Join as clinic staff"
        : "Accept your invitation";

  const staffInviteSubtitle = `Set a password for ${invitePreview?.email ?? "your invited email"}. Staff and doctors join by invitation only — no self-sign-up.`;

  return (
    <AuthLayout
      title={isStaffInvite ? staffInviteTitle : "Start your clinic"}
      subtitle={
        isStaffInvite
          ? staffInviteSubtitle
          : "Clinic owners only. Patients book at /clinic/your-slug without an account."
      }
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
          <AuthEmailField
            control={form.control}
            name="email"
            label="Email"
            disabled={isStaffInvite && Boolean(invitePreview?.email)}
          />
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

          <AuthSubmitButton loading={loading} loadingLabel="Creating account…">
            {isStaffInvite ? "Create password & continue" : "Create owner account"}
          </AuthSubmitButton>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        {isStaffInvite ? (
          <>
            Already have an account?{" "}
            <Link href={`/sign-in?next=${encodeURIComponent(nextPath)}`} className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            Doctor or staff? Use your{" "}
            <Link href="/accept-invite" className="font-medium text-primary hover:underline">
              invitation link
            </Link>
            . Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </AuthLayout>
  );
}

export function SignUpScreen() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading…" />}>
      <SignUpContent />
    </Suspense>
  );
}
