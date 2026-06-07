"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LayoutDashboard } from "lucide-react";

import { DailyCalendarGrid } from "@/components/appointments/organisms/DailyCalendarGrid";
import { Button } from "@/components/ui/button";
import { useAdminGuard } from "@/components/common/hooks/useAdminGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { AccessGate, LoadingScreen, PageHeader, PageShell } from "@/components/common/layout/PageShell";
import type { RootState } from "@/components/common/store";
import { useAppointmentSync } from "@/components/appointments/hooks/useAppointmentSync";
import { useEscalationWatch } from "@/components/appointments/hooks/useEscalationWatch";
import { useGetAppointmentsQuery } from "@/components/appointments/store/appointmentsApi";
import { dismissEscalation, setAppointments } from "@/components/appointments/store/appointmentsSlice";
import { useEscalateSessionMutation } from "@/components/patient-triage/store/triageApi";
import { IMAGES } from "@/lib/constants/images";

export function FrontDeskWorkspace() {
  const dispatch = useDispatch();
  const { isAdmin, loading: authLoading } = useAdminGuard();
  const { tenantId, session } = useAuthSession();
  const [escalate] = useEscalateSessionMutation();

  useEscalationWatch(tenantId);
  useAppointmentSync(tenantId);

  const { escalations, appointments, selectedDate } = useSelector(
    (state: RootState) => state.appointments,
  );

  const { data } = useGetAppointmentsQuery(selectedDate, { skip: !isAdmin });

  useEffect(() => {
    if (data?.appointments) dispatch(setAppointments(data.appointments));
  }, [data, dispatch]);

  if (authLoading) return <LoadingScreen message="Loading workspace…" />;
  if (!session) {
    return (
      <AccessGate
        title="Sign in to access front desk"
        description="Real-time escalations and today's schedule require an authenticated staff session."
        icon={<LayoutDashboard className="size-8" />}
        requireAdmin
      />
    );
  }
  if (!isAdmin) {
    return (
      <AccessGate
        title="Front-desk access required"
        description="Your account needs clinic_admin or admin role in Supabase app metadata."
        icon={<LayoutDashboard className="size-8" />}
        requireAdmin
      />
    );
  }

  return (
    <PageShell maxWidth="7xl" className="flex min-h-[calc(100vh-12rem)] flex-col gap-6 pb-8">
      <PageHeader
        eyebrow="Staff tools"
        title="Front Desk Workspace"
        description="Monitor real-time escalations and today's appointment calendar in one view."
        image={IMAGES.frontDesk}
        imageAlt="Front desk team at work"
      />

      <div className="grid min-h-[480px] flex-1 gap-4 lg:grid-cols-2">
        <section className="hero-glow flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card">
          <div className="border-b border-border/60 bg-destructive/5 px-4 py-3 sm:px-5">
            <h2 className="flex items-center gap-2 font-semibold">
              Escalation Queue
              {escalations.length > 0 ? (
                <span className="rounded-full bg-destructive px-2.5 py-0.5 text-xs font-medium text-destructive-foreground">
                  {escalations.length}
                </span>
              ) : null}
            </h2>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
            {escalations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <p className="font-medium text-muted-foreground">All clear</p>
                <p className="text-sm text-muted-foreground">No active escalations right now.</p>
              </div>
            ) : (
              escalations.map((e) => (
                <div
                  key={e.id}
                  className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 shadow-sm"
                >
                  <p className="font-medium">{e.patient_name || "Unknown patient"}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                    {e.ai_summary || "Patient requested human assistance."}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        escalate({ sessionId: e.id }).then(() => dispatch(dismissEscalation(e.id)))
                      }
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

        <section className="hero-glow flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card">
          <div className="border-b border-border/60 px-4 py-3 sm:px-5">
            <h2 className="font-semibold">Today&apos;s Schedule</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <DailyCalendarGrid appointments={appointments} date={selectedDate} />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
