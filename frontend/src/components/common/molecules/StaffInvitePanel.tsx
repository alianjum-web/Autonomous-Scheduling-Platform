"use client";

import { useState } from "react";
import { Mail, Users } from "lucide-react";

import {
  useCreateStaffInviteMutation,
  useListStaffInvitesQuery,
} from "@/components/common/store/staffApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingInviteRow, notifyInviteResult } from "@/components/common/molecules/PendingInviteRow";
import { showToast } from "@/components/ui/toast";

export function StaffInvitePanel() {
  const { data, isLoading } = useListStaffInvitesQuery();
  const [createInvite, { isLoading: sending }] = useCreateStaffInviteMutation();
  const [email, setEmail] = useState("");

  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    try {
      const result = await createInvite({ email: trimmed }).unwrap();
      setEmail("");
      notifyInviteResult(trimmed, result);
    } catch (err) {
      showToast({
        title: "Could not send invite",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  const pending = (data?.invites ?? []).filter((i) => !i.accepted_at);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5 text-primary" aria-hidden />
          Invite staff
        </CardTitle>
        <CardDescription>
          Send email invites to front-desk and scheduling staff. They sign in and accept — no manual
          Supabase edits.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1 space-y-2">
            <Label htmlFor="staff-email">Staff email</Label>
            <Input
              id="staff-email"
              type="email"
              placeholder="frontdesk@harbormedical.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            className="sm:self-end"
            disabled={sending || !email.trim()}
            onClick={() => void handleInvite()}
          >
            <Mail className="mr-2 size-4" aria-hidden />
            Send invite
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading invites…</p>
        ) : pending.length > 0 ? (
          <ul className="space-y-2">
            {pending.map((invite) => (
              <PendingInviteRow key={invite.id} email={invite.email} token={invite.token} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No pending invites.</p>
        )}
      </CardContent>
    </Card>
  );
}
