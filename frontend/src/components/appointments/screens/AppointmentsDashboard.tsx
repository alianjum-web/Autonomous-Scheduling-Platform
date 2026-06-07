"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CalendarDays, Clock, Users, Zap } from "lucide-react";

import { AppointmentCard } from "@/components/appointments/molecules/AppointmentCard";
import { AppointmentDetailPanel } from "@/components/appointments/organisms/AppointmentDetailPanel";
import { DailyCalendarGrid } from "@/components/appointments/organisms/DailyCalendarGrid";
import { useAppointmentSync } from "@/components/appointments/hooks/useAppointmentSync";
import { useGetAppointmentsQuery } from "@/components/appointments/store/appointmentsApi";
import {
  setAppointments,
  setSelectedAppointment,
  setSelectedDate,
  setViewMode,
} from "@/components/appointments/store/appointmentsSlice";
import { MiniBarChart } from "@/components/common/atoms/MiniBarChart";
import { StatCard } from "@/components/common/atoms/StatCard";
import { useAdminGuard } from "@/components/common/hooks/useAdminGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { AccessGate, LoadingScreen, PageHeader, PageShell } from "@/components/common/layout/PageShell";
import { useReduxForm } from "@/components/common/hooks/useReduxForm";
import type { RootState } from "@/components/common/store";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { IMAGES } from "@/lib/constants/images";

interface DateFilterForm {
  selectedDate: string;
}

export function AppointmentsDashboard() {
  const dispatch = useDispatch();
  const { isAdmin, loading: authLoading } = useAdminGuard();
  const { tenantId, session } = useAuthSession();
  useAppointmentSync(tenantId);

  const { selectedDate, viewMode, appointments, selectedAppointmentId } = useSelector(
    (state: RootState) => state.appointments,
  );

  const form = useReduxForm<DateFilterForm>({ selectedDate });

  const { data, refetch } = useGetAppointmentsQuery(selectedDate, { skip: !isAdmin });

  useEffect(() => {
    if (data?.appointments) dispatch(setAppointments(data.appointments));
  }, [data, dispatch]);

  const selected = appointments.find((a) => a.id === selectedAppointmentId) ?? null;

  if (authLoading) return <LoadingScreen message="Checking permissions…" />;
  if (!session) {
    return (
      <AccessGate
        title="Sign in to view appointments"
        description="The appointments dashboard requires an authenticated staff session with clinic admin privileges."
        icon={<CalendarDays className="size-8" />}
        requireAdmin
      />
    );
  }
  if (!isAdmin) {
    return (
      <AccessGate
        title="Admin access required"
        description="Your account is signed in but lacks the clinic_admin role. Contact your administrator to update Supabase app metadata."
        icon={<CalendarDays className="size-8" />}
        requireAdmin
      />
    );
  }

  return (
    <PageShell maxWidth="full" className="gap-6 px-6 py-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back! <span className="inline-block animate-pulse">👋</span>
        </h1>
        <p className="text-sm text-muted-foreground">Today&apos;s appointments and schedule overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Appointments"
          value={appointments.length}
          trend="+12% this month"
          trendUp
          icon={CalendarDays}
        >
          <MiniBarChart
            data={[
              { value: 4 },
              { value: 7 },
              { value: 5 },
              { value: 9 },
              { value: appointments.length || 6 },
            ]}
          />
        </StatCard>
        <StatCard
          label="Confirmed"
          value={appointments.filter((a) => a.status === "confirmed").length}
          trend="On track"
          icon={Users}
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          label="Pending"
          value={appointments.filter((a) => a.status === "pending").length}
          trend="-3% this week"
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

      <PageHeader
        eyebrow="Schedule"
        title="Appointments Dashboard"
        description="Day and week views with real-time sync and distributed slot locking."
        image={IMAGES.appointments}
        imageAlt="Modern clinic reception"
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
        <div className="lg:col-span-2">
          {viewMode === "day" ? (
            <DailyCalendarGrid
              appointments={appointments}
              date={selectedDate}
              onSelect={(id) => dispatch(setSelectedAppointment(id))}
            />
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  selected={a.id === selectedAppointmentId}
                  onClick={() => dispatch(setSelectedAppointment(a.id))}
                />
              ))}
            </div>
          )}
        </div>
        <AppointmentDetailPanel
          appointment={selected}
          onClose={() => dispatch(setSelectedAppointment(null))}
        />
      </div>
    </PageShell>
  );
}
