"use client";

import { useDispatch, useSelector } from "react-redux";

import { DailyCalendarGrid } from "@/components/appointments/organisms/DailyCalendarGrid";
import { Button } from "@/components/ui/button";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { useAppointmentSync } from "@/hooks/useAppointmentSync";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useEscalationWatch } from "@/hooks/useEscalationWatch";
import { useEscalateSessionMutation } from "@/store/api";
import { dismissEscalation } from "@/store/appointmentsSlice";
import type { RootState } from "@/store";

export function FrontDeskWorkspace() {
  const dispatch = useDispatch();
  const { isAdmin, loading } = useAdminGuard();
  const { tenantId } = useAuthSession();
  const [escalate] = useEscalateSessionMutation();

  useEscalationWatch(tenantId);
  useAppointmentSync(tenantId);

  const { escalations, appointments, selectedDate } = useSelector(
    (state: RootState) => state.appointments,
  );

  if (loading) return <p className="p-8 text-muted-foreground">Loading…</p>;
  if (!isAdmin) return <p className="p-8 text-muted-foreground">Front-desk access required.</p>;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-7xl flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Front Desk Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Real-time escalation queue and today&apos;s calendar
        </p>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <section className="flex flex-col overflow-hidden rounded-xl border">
          <div className="border-b px-4 py-3">
            <h2 className="font-medium">
              Escalation Queue
              {escalations.length > 0 ? (
                <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                  {escalations.length}
                </span>
              ) : null}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {escalations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active escalations.</p>
            ) : (
              escalations.map((e) => (
                <div key={e.id} className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="font-medium">{e.patient_name || "Unknown patient"}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                    {e.ai_summary || "Patient requested human assistance."}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => escalate({ sessionId: e.id }).then(() => dispatch(dismissEscalation(e.id)))}
                    >
                      Acknowledge
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => dispatch(dismissEscalation(e.id))}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="flex flex-col overflow-hidden rounded-xl border">
          <div className="border-b px-4 py-3">
            <h2 className="font-medium">Today&apos;s Schedule</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <DailyCalendarGrid appointments={appointments} date={selectedDate} />
          </div>
        </section>
      </div>
    </div>
  );
}
