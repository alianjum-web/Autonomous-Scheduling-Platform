"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Building2, Shield, User } from "lucide-react";

import { useAdminGuard } from "@/components/common/hooks/useAdminGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { AccessGate, LoadingScreen, PageHeader, PageShell } from "@/components/common/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchUserProfile } from "@/lib/supabase/onboarding";
import { createClient } from "@/lib/supabase/client";

export function SettingsScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuthSession();
  const { isAdmin, clinicRole } = useAdminGuard();
  const [profileLoading, setProfileLoading] = useState(true);
  const [clinicName, setClinicName] = useState<string | null>(null);
  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetchUserProfile()
      .then((data) => {
        const tenant = data?.profile?.tenants as { name?: string; slug?: string } | null;
        setClinicName(tenant?.name ?? null);
        setWorkspaceSlug(tenant?.slug ?? null);
      })
      .finally(() => setProfileLoading(false));
  }, [session]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
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
      />
    );
  }

  return (
    <PageShell maxWidth="2xl" className="gap-8 pb-12">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, workspace, and security preferences."
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
              <span className="font-medium">{session.user.email}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">
                {(session.user.user_metadata?.full_name as string) || "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{clinicRole ?? "patient"}</span>
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
              <span className="font-medium">{clinicName ?? "Not configured"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-mono text-xs">{workspaceSlug ?? "—"}</span>
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
