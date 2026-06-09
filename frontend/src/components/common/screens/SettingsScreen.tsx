"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Building2, Shield, User } from "lucide-react";

import { useAdminGuard } from "@/components/common/hooks/useAdminGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { PageShell } from "@/components/common/layout/PageShell";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { resetFeatureState } from "@/components/common/store/resetFeatureState";
import { useGetBAAStatusQuery, useAcknowledgeBAAMutation, useGetUserProfileQuery } from "@/components/common/store/settingsApi";
import { showToast } from "@/components/ui/toast";
import { useAppDispatch } from "@/components/common/store/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export function SettingsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { session, loading: authLoading } = useAuthSession();
  const { isAdmin, clinicRole } = useAdminGuard();
  const { data: profile, isLoading: profileLoading } = useGetUserProfileQuery(undefined, {
    skip: !session,
  });
  const { data: baaStatus, isLoading: baaLoading } = useGetBAAStatusQuery(undefined, {
    skip: !session,
  });
  const [acknowledgeBAA, { isLoading: acknowledgingBAA }] = useAcknowledgeBAAMutation();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    resetFeatureState(dispatch);
    router.push("/");
    router.refresh();
  };

  if (authLoading || profileLoading) return <LoadingScreen message="Loading settings…" />;

  if (!session) {
    return (
      <AccessGate
        title="Sign in to manage settings"
        description="Account settings require an authenticated session."
        icon={<User className="size-8" />}
        imageKey="auth"
      />
    );
  }

  const handleAcknowledgeBAA = async () => {
    try {
      await acknowledgeBAA().unwrap();
      showToast({
        title: "BAA acknowledged",
        description: "AI triage and document embedding are now enabled for your clinic.",
      });
    } catch {
      showToast({
        title: "Could not acknowledge BAA",
        description: "Only clinic admins can enable AI features.",
        variant: "destructive",
      });
    }
  };

  return (
    <PageShell maxWidth="2xl" className="gap-8 pb-12">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, workspace, and security preferences."
        imageKey="auth"
      />

      <div className="grid gap-6">
        <Card className="hero-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5 text-primary" aria-hidden />
              Profile
            </CardTitle>
            <CardDescription>Your authenticated account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{profile?.email ?? session.user.email}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">
                {profile?.fullName ??
                  ((session.user.user_metadata?.full_name as string) || "—")}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{clinicRole ?? profile?.role ?? "patient"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" aria-hidden />
              Workspace
            </CardTitle>
            <CardDescription>Your clinic tenant on this platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Clinic</span>
              <span className="font-medium">{profile?.clinicName ?? "Not configured"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-mono text-xs">{profile?.workspaceSlug ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" aria-hidden />
              Security
            </CardTitle>
            <CardDescription>Password and session management</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/forgot-password">Change password</Link>
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Sign out everywhere
            </Button>
          </CardContent>
        </Card>

        <Card className={baaStatus?.baa_signed ? "border-success/30" : "border-warning/40"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" aria-hidden />
              HIPAA Business Associate Agreement
            </CardTitle>
            <CardDescription>
              AI patient triage and document embedding require a signed BAA before processing clinic
              data in production.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {baaLoading ? (
              <p className="text-muted-foreground">Checking compliance status…</p>
            ) : baaStatus ? (
              <>
                <div className="grid gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Environment</span>
                    <span className="font-mono">{baaStatus.environment}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Enforcement</span>
                    <span>{baaStatus.enforcement_enabled ? "Active" : "Off (dev)"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">AI features</span>
                    <span>{baaStatus.ai_features_available ? "Available" : "Blocked"}</span>
                  </div>
                  {baaStatus.signed_at ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Signed at</span>
                      <span>{new Date(baaStatus.signed_at).toLocaleString()}</span>
                    </div>
                  ) : null}
                </div>
                {baaStatus.baa_signed ? (
                  <p className="text-success-foreground">
                    BAA acknowledged — AI triage and document embedding are enabled for this clinic.
                  </p>
                ) : baaStatus.enforcement_enabled ? (
                  <>
                    <p className="text-muted-foreground">
                      AI chat and RAG ingestion are blocked until a clinic admin acknowledges the
                      BAA. Review the{" "}
                      <Link href="/hipaa-notice" className="font-medium text-primary underline">
                        HIPAA notice
                      </Link>{" "}
                      before proceeding.
                    </p>
                    {isAdmin ? (
                      <Button
                        onClick={() => void handleAcknowledgeBAA()}
                        disabled={acknowledgingBAA}
                      >
                        {acknowledgingBAA ? "Saving…" : "Acknowledge BAA & enable AI"}
                      </Button>
                    ) : (
                      <p className="text-muted-foreground">
                        Only clinic admins can acknowledge the BAA. Contact your administrator.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    BAA enforcement is off in this environment — AI works without acknowledgement.
                    Production enables enforcement automatically.
                  </p>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>

        {isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-5 text-primary" aria-hidden />
                Staff preferences
              </CardTitle>
              <CardDescription>Front-desk and dashboard notifications</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Real-time escalation alerts are enabled via Supabase Realtime when you open the Front
              Desk workspace.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PageShell>
  );
}
