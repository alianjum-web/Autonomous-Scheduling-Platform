"use client";

import { Copy } from "lucide-react";

import { copyStaffInviteLink } from "@/lib/staff/inviteUrl";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";

interface PendingInviteRowProps {
  email: string;
  token: string;
  roleLabel?: string;
}

export function PendingInviteRow({ email, token, roleLabel }: PendingInviteRowProps) {
  const handleCopy = async () => {
    const copied = await copyStaffInviteLink(token);
    showToast(
      copied
        ? {
            title: "Invite link copied",
            description: "Send this link to the doctor — they must sign up with the invited email.",
          }
        : {
            title: "Could not copy link",
            variant: "destructive",
          },
    );
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{email}</p>
        <p className="text-xs text-muted-foreground">
          {roleLabel ? `${roleLabel} · ` : ""}awaiting acceptance
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy()}>
        <Copy className="mr-1 size-3.5" aria-hidden />
        Copy invite link
      </Button>
    </li>
  );
}

export function notifyInviteResult(
  email: string,
  result: { email_sent?: boolean },
): void {
  if (result.email_sent) {
    showToast({
      title: "Invite sent",
      description: `Email delivered to ${email}.`,
    });
    return;
  }

  showToast({
    title: "Invite saved — email not delivered",
    description:
      "Resend sandbox (onboarding@resend.dev) only sends to your Resend account email. Copy the invite link below and share it manually, or verify a domain in Resend.",
    variant: "destructive",
  });
}
