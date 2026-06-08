"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/components/common/store/hooks";

import {
  addEscalation,
  type Escalation,
} from "@/components/appointments/store/appointmentsSlice";
import { showToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

export function useEscalationWatch(tenantId: string | null) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!tenantId) return;

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`escalations:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "patient_sessions",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const row = payload.new as Escalation;
          const name = row.patient_name || "A patient";

          if (row.current_triage_status === "emergency") {
            dispatch(addEscalation(row));
            showToast({
              title: "EMERGENCY — Immediate Attention",
              description: `${name} may be experiencing a medical emergency.`,
              variant: "destructive",
            });
            if (document.hidden && Notification.permission === "granted") {
              new Notification("EMERGENCY — Patient Alert", {
                body: `${name} — possible medical emergency.`,
                requireInteraction: true,
              });
            }
          } else if (row.current_triage_status === "escalated_to_human") {
            dispatch(addEscalation(row));
            showToast({
              title: "Patient Needs Assistance",
              description: `${name} is waiting for a care coordinator.`,
              variant: "destructive",
            });
            if (document.hidden && Notification.permission === "granted") {
              new Notification("Patient Needs Assistance", {
                body: `${name} is waiting.`,
              });
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, dispatch]);
}
