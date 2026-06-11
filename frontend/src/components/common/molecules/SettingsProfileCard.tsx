import { User } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsProfileCardProps {
  email: string;
  fullName: string;
  role: string;
}

export function SettingsProfileCard({ email, fullName, role }: SettingsProfileCardProps) {
  return (
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
          <span className="font-medium">{email}</span>
        </div>
        <div className="flex justify-between gap-4 border-b border-border/60 pb-3">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">{fullName}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Role</span>
          <span className="font-medium capitalize">{role}</span>
        </div>
      </CardContent>
    </Card>
  );
}
