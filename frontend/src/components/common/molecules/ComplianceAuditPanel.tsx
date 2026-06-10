"use client";

import { ClipboardList } from "lucide-react";

import { useGetComplianceReportQuery } from "@/components/common/store/settingsApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ACTION_LABELS: Record<string, string> = {
  baa_acknowledged: "BAA acknowledged",
  calendar_config_updated: "Calendar settings updated",
};

export function ComplianceAuditPanel() {
  const { data: report, isLoading } = useGetComplianceReportQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="size-5 text-primary" aria-hidden />
          Compliance audit trail
        </CardTitle>
        <CardDescription>
          Recent HIPAA and calendar compliance events for your clinic (admin only).
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        {isLoading ? (
          <p className="text-muted-foreground">Loading audit log…</p>
        ) : !report?.recent_audit.length ? (
          <p className="text-muted-foreground">No compliance events recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {report.recent_audit.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </span>
                  <time className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </time>
                </div>
                {entry.actor_id ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    Actor: {entry.actor_id.slice(0, 8)}…
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
