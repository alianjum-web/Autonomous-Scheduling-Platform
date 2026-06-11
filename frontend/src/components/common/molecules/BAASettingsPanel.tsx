import Link from "next/link";
import { Shield } from "lucide-react";

import type { BAAStatusResponse } from "@/components/common/store/settingsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BAASettingsPanelProps {
  baaStatus: BAAStatusResponse | undefined;
  isLoading: boolean;
  isAdmin: boolean;
  acknowledging: boolean;
  onAcknowledge: () => void;
}

export function BAASettingsPanel({
  baaStatus,
  isLoading,
  isAdmin,
  acknowledging,
  onAcknowledge,
}: BAASettingsPanelProps) {
  return (
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
        {isLoading ? (
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
                  AI chat and RAG ingestion are blocked until a clinic admin acknowledges the BAA.
                  Review the{" "}
                  <Link href="/hipaa-notice" className="font-medium text-primary underline">
                    HIPAA notice
                  </Link>{" "}
                  before proceeding.
                </p>
                {isAdmin ? (
                  <Button onClick={() => void onAcknowledge()} disabled={acknowledging}>
                    {acknowledging ? "Saving…" : "Acknowledge BAA & enable AI"}
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
  );
}
