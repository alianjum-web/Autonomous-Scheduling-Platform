import { Bell } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function StaffPreferencesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-5 text-primary" aria-hidden />
          Staff preferences
        </CardTitle>
        <CardDescription>Front-desk and dashboard notifications</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Real-time escalation alerts are enabled via Supabase Realtime when you open the Front Desk
        workspace.
      </CardContent>
    </Card>
  );
}
