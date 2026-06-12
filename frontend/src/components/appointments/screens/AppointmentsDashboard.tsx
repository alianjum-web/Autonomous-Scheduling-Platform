"use client";

import { useEffect, useMemo, useRef } from "react";
import { CalendarDays, Clock, Users, Zap } from "lucide-react";

import { AppointmentDetailPanel } from "@/components/appointments/organisms/AppointmentDetailPanel";
import { DailyCalendarGrid } from "@/components/appointments/organisms/DailyCalendarGrid";
import { UpcomingAppointmentsList } from "@/components/appointments/molecules/UpcomingAppointmentsList";
import { useAppointmentSync } from "@/components/appointments/hooks/useAppointmentSync";
import { useGetAppointmentsQuery } from "@/components/appointments/store/appointmentsApi";
import {
  selectSelectedAppointmentId,
  selectSelectedDate,
  selectViewMode,
} from "@/components/appointments/store/appointmentsSelectors";
import {
  setSelectedAppointment,
  setSelectedDate,
  setViewMode,
} from "@/components/appointments/store/appointmentsSlice";
import { MiniBarChart } from "@/components/common/atoms/MiniBarChart";
import { StatCard } from "@/components/common/atoms/StatCard";
import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { useGetMyProviderQuery } from "@/components/common/store/staffApi";
import { LoadingScreen } from "@/components/common/molecules/LoadingScreen";
import { PageShell } from "@/components/common/layout/PageShell";
import { AccessGate } from "@/components/common/molecules/AccessGate";
import { PageHeader } from "@/components/common/molecules/PageHeader";
import { useReduxForm } from "@/components/common/hooks/useReduxForm";
import { useAppDispatch, useAppSelector } from "@/components/common/store/hooks";
import {
  appointmentsInWeek,
  appointmentsOnDate,
  nextAppointmentDate,
  todayDateKey,
  upcomingAppointments,
} from "@/lib/scheduling/appointmentTime";
import { appointmentMatchesProvider } from "@/lib/scheduling/providerMatching";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface DateFilterForm {
  selectedDate: string;
}

export function AppointmentsDashboard() {
  const dispatch = useAppDispatch();
  const { isStaff, isDoctor, loading: authLoading } = useRoleGuard();
  const { tenantId, session } = useAuthSession();
  const { data: provider } = useGetMyProviderQuery(undefined, { skip: !isDoctor });
  useAppointmentSync(tenantId);

  const selectedDate = useAppSelector(selectSelectedDate);
  const viewMode = useAppSelector(selectViewMode);
  const selectedAppointmentId = useAppSelector(selectSelectedAppointmentId);
  const initializedDate = useRef(false);

  const formValues = useMemo(() => ({ selectedDate }), [selectedDate]);
  const form = useReduxForm<DateFilterForm>(formValues);

  const { data, refetch, isLoading } = useGetAppointmentsQuery(undefined, { skip: !isStaff });
  const allAppointments = useMemo(() => {
    const rows = data?.appointments ?? [];
    if (!isDoctor) return rows;
    return rows.filter((row) => appointmentMatchesProvider(row, provider));
  }, [data?.appointments, isDoctor, provider]);
  const today = todayDateKey();

  const dayAppointments = useMemo(
    () => appointmentsOnDate(allAppointments, selectedDate),
    [allAppointments, selectedDate],
  );
  const weekAppointments = useMemo(
    () => appointmentsInWeek(allAppointments, selectedDate),
    [allAppointments, selectedDate],
  );
  const upcoming = useMemo(() => upcomingAppointments(allAppointments, today), [allAppointments, today]);
  const selected = useMemo(
    () =>
      selectedAppointmentId
        ? (allAppointments.find((a) => a.id === selectedAppointmentId) ?? null)
        : null,
    [allAppointments, selectedAppointmentId],
  );

  useEffect(() => {
    if (!allAppointments.length || initializedDate.current) return;
    initializedDate.current = true;
    if (appointmentsOnDate(allAppointments, selectedDate).length > 0) return;
    const next = nextAppointmentDate(allAppointments, today);
    if (next) dispatch(setSelectedDate(next));
  }, [allAppointments, dispatch, selectedDate, today]);

  if (authLoading) return <LoadingScreen message="Checking permissions…" />;
  if (!session) {
    return (
      <AccessGate
        title="Sign in to view appointments"
        description="Appointments require a signed-in clinic staff or doctor account."
        icon={<CalendarDays className="size-8" />}
        imageKey="appointments"
        requireAdmin
      />
    );
  }
  if (!isStaff) {
    return (
      <AccessGate
        title="Staff access required"
        description="Your account is signed in but lacks staff permissions. Contact your clinic owner."
        icon={<CalendarDays className="size-8" />}
        imageKey="appointments"
        requireAdmin
        signedIn
      />
    );
  }

  return (
    <PageShell maxWidth="full" className="gap-6 px-6 py-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {isDoctor ? "Your appointments" : "Appointments"}
          {!isDoctor ? <span className="inline-block animate-pulse"> 👋</span> : null}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isDoctor
            ? `${upcoming.length} upcoming booking${upcoming.length === 1 ? "" : "s"} assigned to you`
            : `${upcoming.length} upcoming appointment${upcoming.length === 1 ? "" : "s"} at your clinic`}
        </p>
      </div>

      {!isDoctor ? (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Upcoming total"
          value={upcoming.length}
          trend={`${dayAppointments.length} on ${selectedDate}`}
          trendUp
          icon={CalendarDays}
        >
          <MiniBarChart
            data={[
              { value: 4 },
              { value: 7 },
              { value: 5 },
              { value: 9 },
              { value: upcoming.length || 1 },
            ]}
          />
        </StatCard>
        <StatCard
          label="Confirmed"
          value={upcoming.filter((a) => a.status === "confirmed").length}
          trend="Active bookings"
          icon={Users}
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          label="Pending"
          value={upcoming.filter((a) => a.status === "pending").length}
          trend="Awaiting confirmation"
          trendUp={false}
          icon={Clock}
          iconClassName="bg-warning/15 text-warning"
        />
        <StatCard
          label="Real-time Sync"
          value="Live"
          trend="Connected"
          trendUp
          icon={Zap}
          iconClassName="bg-info/10 text-info"
        />
      </div>
      ) : (
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Today"
          value={dayAppointments.length}
          trend={selectedDate}
          icon={CalendarDays}
        />
        <StatCard
          label="Confirmed"
          value={upcoming.filter((a) => a.status === "confirmed").length}
          trend="Active bookings"
          icon={Users}
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          label="Pending"
          value={upcoming.filter((a) => a.status === "pending").length}
          trend="Awaiting confirmation"
          trendUp={false}
          icon={Clock}
          iconClassName="bg-warning/15 text-warning"
        />
      </div>
      )}

      <PageHeader
        eyebrow={isDoctor ? "Doctor" : "Schedule"}
        title={isDoctor ? "Appointment calendar" : "Appointments Dashboard"}
        description={
          isDoctor
            ? "Select an appointment to read the AI triage summary before the visit."
            : "Calendar uses your local timezone. Change the date to view other days."
        }
        imageKey="appointments"
        actions={
          <>
            <Form {...form}>
              <FormField
                control={form.control}
                name="selectedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="date"
                        aria-label="Select date"
                        className="w-auto"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          dispatch(setSelectedDate(e.target.value));
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </Form>
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => dispatch(setViewMode("day"))}
            >
              Day
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => dispatch(setViewMode("week"))}
            >
              Week
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {viewMode === "day" ? (
            <>
              <DailyCalendarGrid
                appointments={allAppointments}
                date={selectedDate}
                onSelect={(id) => dispatch(setSelectedAppointment(id))}
              />
              {dayAppointments.length === 0 && !isLoading ? (
                <p className="text-sm text-muted-foreground">
                  No appointments on this day.{" "}
                  {upcoming.length > 0 ? "See all upcoming bookings below." : ""}
                </p>
              ) : null}
            </>
          ) : (
            <UpcomingAppointmentsList
              appointments={weekAppointments}
              selectedId={selectedAppointmentId}
              onSelect={(id) => dispatch(setSelectedAppointment(id))}
              emptyMessage="No appointments this week."
            />
          )}

          <div>
            <h2 className="mb-3 text-sm font-semibold">All upcoming bookings</h2>
            <UpcomingAppointmentsList
              appointments={upcoming}
              selectedId={selectedAppointmentId}
              onSelect={(id) => {
                dispatch(setSelectedAppointment(id));
                const appt = upcoming.find((a) => a.id === id);
                if (appt) dispatch(setSelectedDate(appt.slot_start.slice(0, 10)));
              }}
            />
          </div>
        </div>
        <AppointmentDetailPanel
          appointment={selected}
          onClose={() => dispatch(setSelectedAppointment(null))}
        />
      </div>
    </PageShell>
  );
}
