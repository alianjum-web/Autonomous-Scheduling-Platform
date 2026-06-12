"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthSubmitButton } from "@/components/auth/atoms/AuthSubmitButton";
import { AuthSuccessBanner } from "@/components/auth/atoms/AuthSuccessBanner";
import { useAuthSubmitState } from "@/components/auth/hooks/useAuthSubmitState";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { AuthEmailField } from "@/components/auth/molecules/AuthEmailField";
import { AuthPasswordField } from "@/components/auth/molecules/AuthPasswordField";
import { useLocalForm } from "@/components/common/hooks/useLocalForm";
import { useAppDispatch } from "@/components/common/store/hooks";
import { Form } from "@/components/ui/form";
import { postAuthPath } from "@/lib/auth/postAuthPath";
import { createClient } from "@/lib/supabase/client";
import { syncAuthSession } from "@/components/auth/session/syncAuthSession";

interface SignInFormValues {
  email: string;
  password: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_failed: "Authentication failed. Please try signing in again.",
};

export function SignInScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitNext = searchParams.get("next");
  const queryError = searchParams.get("error");
  const queryMessage = searchParams.get("message");
  const { submitError, setSubmitError, successMessage, loading, setLoading, clearMessages } =
    useAuthSubmitState();

  const bannerError = queryError
    ? (ERROR_MESSAGES[queryError] ?? "Sign in failed. Please try again.")
    : null;
  const bannerSuccess =
    queryMessage === "password_updated"
      ? "Password updated successfully. You can sign in now."
      : null;

  const form = useLocalForm<SignInFormValues>({ email: "", password: "" });
  const supabase = createClient();
  const dispatch = useAppDispatch();

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    clearMessages();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      const unconfirmed =
        error.message.toLowerCase().includes("email not confirmed") ||
        error.message.toLowerCase().includes("not confirmed");
      if (unconfirmed) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setSubmitError(error.message);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const profileData = await syncAuthSession(dispatch, session);
    const destination = postAuthPath(
      {
        role: profileData?.profile?.role,
        tenant_id: profileData?.profile?.tenant_id,
        userId: profileData?.user?.id,
      },
      explicitNext,
    );
    router.push(destination);
    router.refresh();
  });

  return (
    <AuthLayout
      title="Staff sign in"
      subtitle="Clinic owners, staff, and invited doctors. Patients book without an account."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-5">
          <AuthEmailField control={form.control} name="email" />
          <AuthPasswordField
            control={form.control}
            name="password"
            label="Password"
            labelExtra={
              <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            }
          />

          {bannerSuccess || successMessage ? (
            <AuthSuccessBanner message={bannerSuccess ?? successMessage ?? ""} />
          ) : null}
          {bannerError || submitError ? (
            <AuthErrorBanner message={bannerError ?? submitError ?? ""} />
          ) : null}

          <AuthSubmitButton loading={loading} loadingLabel="Signing in…">
            Sign in
          </AuthSubmitButton>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Clinic owner?{" "}
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          Start your clinic
        </Link>
        {" · "}
        Invited doctor or staff?{" "}
        <Link href="/accept-invite" className="font-medium text-primary hover:underline">
          Accept invite
        </Link>
      </p>
    </AuthLayout>
  );
}
