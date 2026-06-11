import { Building2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsWorkspaceCardProps {
  clinicName: string;
  workspaceSlug: string;
}

export function SettingsWorkspaceCard({ clinicName, workspaceSlug }: SettingsWorkspaceCardProps) {
  return (
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
          <span className="font-medium">{clinicName}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Slug</span>
          <span className="font-mono text-xs">{workspaceSlug}</span>
        </div>
      </CardContent>
    </Card>
  );
}
