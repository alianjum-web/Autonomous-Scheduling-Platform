"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/components/common/store/hooks";

import { appointmentsApi } from "@/components/appointments/store/appointmentsApi";
import {
  removeAppointment,
  upsertAppointment,
  type Appointment,
} from "@/components/appointments/store/appointmentsSlice";
import { createClient } from "@/lib/supabase/client";

export function useAppointmentSync(tenantId: string | null) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!tenantId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`appointments:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as { id?: string };
            if (old.id) dispatch(removeAppointment(old.id));
            return;
          }
          const row = payload.new as Appointment;
          if (row.status === "cancelled") {
            dispatch(removeAppointment(row.id));
          } else {
            dispatch(upsertAppointment(row));
          }
          dispatch(appointmentsApi.util.invalidateTags(["Appointments"]));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, dispatch]);
}
