"use client";

import { useState } from "react";
import { Mail, Stethoscope, Trash2 } from "lucide-react";

import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import {
  useCreateStaffInviteMutation,
  useListDoctorsQuery,
  useListStaffInvitesQuery,
  useRemoveDoctorMutation,
} from "@/components/common/store/staffApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingInviteRow, notifyInviteResult } from "@/components/common/molecules/PendingInviteRow";
import { showToast } from "@/components/ui/toast";

export function DoctorsInvitePanel() {
  const { isOwner } = useRoleGuard();
  const { data: inviteData, isLoading: invitesLoading } = useListStaffInvitesQuery(undefined, {
    skip: !isOwner,
  });
  const { data: doctorData, isLoading: doctorsLoading } = useListDoctorsQuery(undefined, {
    skip: !isOwner,
  });
  const [createInvite, { isLoading: sending }] = useCreateStaffInviteMutation();
  const [removeDoctor, { isLoading: removing }] = useRemoveDoctorMutation();
  const [email, setEmail] = useState("");

  if (!isOwner) return null;

  const pending = (inviteData?.invites ?? []).filter(
    (i) => !i.accepted_at && i.role === "doctor",
  );
  const doctors = doctorData?.providers ?? [];

  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    try {
      const result = await createInvite({ email: trimmed, role: "doctor" }).unwrap();
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

  const handleRemove = async (profileId: string, name: string) => {
    try {
      await removeDoctor(profileId).unwrap();
      showToast({ title: "Doctor removed", description: `${name} no longer has clinic access.` });
    } catch {
      showToast({ title: "Could not remove doctor", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="size-5 text-primary" aria-hidden />
          Invite doctors
        </CardTitle>
        <CardDescription>
          Doctors receive an email, create a password, and land on their own dashboard and schedule.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1 space-y-2">
            <Label htmlFor="doctor-email">Doctor email</Label>
            <Input
              id="doctor-email"
              type="email"
              placeholder="dr.smith@harbormedical.com"
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

        {doctorsLoading ? (
          <p className="text-sm text-muted-foreground">Loading doctors…</p>
        ) : doctors.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {doctors.map((doctor) => (
              <li
                key={doctor.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
              >
                <div>
                  <p className="font-medium">{doctor.display_name}</p>
                  <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={removing}
                  onClick={() => void handleRemove(doctor.profile_id, doctor.display_name)}
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden />
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No doctors yet — invite your first provider.</p>
        )}

        {invitesLoading ? null : pending.length > 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pending invites
            </p>
            <ul className="space-y-2">
              {pending.map((invite) => (
                <PendingInviteRow
                  key={invite.id}
                  email={invite.email}
                  token={invite.token}
                  roleLabel="Doctor"
                />
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
