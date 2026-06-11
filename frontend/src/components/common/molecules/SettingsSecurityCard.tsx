import Link from "next/link";
import { Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsSecurityCardProps {
  onSignOut: () => void;
}

export function SettingsSecurityCard({ onSignOut }: SettingsSecurityCardProps) {
  return (
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
        <Button variant="outline" onClick={onSignOut}>
          Sign out everywhere
        </Button>
      </CardContent>
    </Card>
  );
}
