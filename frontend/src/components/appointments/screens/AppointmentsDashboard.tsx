"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { AppointmentCard } from "@/components/appointments/molecules/AppointmentCard";
import { AppointmentDetailPanel } from "@/components/appointments/organisms/AppointmentDetailPanel";
import { DailyCalendarGrid } from "@/components/appointments/organisms/DailyCalendarGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { useAppointmentSync } from "@/hooks/useAppointmentSync";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useGetAppointmentsQuery } from "@/store/api";
import {
  setAppointments,
  setSelectedAppointment,
  setSelectedDate,
  setViewMode,
} from "@/store/appointmentsSlice";
import type { RootState } from "@/store";

export function AppointmentsDashboard() {
  const dispatch = useDispatch();
  const { isAdmin, loading } = useAdminGuard();
  const { tenantId } = useAuthSession();
  useAppointmentSync(tenantId);

  const { selectedDate, viewMode, appointments, selectedAppointmentId } = useSelector(
    (state: RootState) => state.appointments,
  );

  const { data, refetch } = useGetAppointmentsQuery(selectedDate, { skip: !isAdmin });

  useEffect(() => {
    if (data?.appointments) dispatch(setAppointments(data.appointments));
  }, [data, dispatch]);

  const selected = appointments.find((a) => a.id === selectedAppointmentId) ?? null;

  if (loading) return <p className="p-8 text-muted-foreground">Loading…</p>;
  if (!isAdmin) return <p className="p-8 text-muted-foreground">Admin access required.</p>;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Appointments Dashboard</h1>
          <p className="text-sm text-muted-foreground">Day and week view with real-time sync</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => dispatch(setSelectedDate(e.target.value))}
            aria-label="Select date"
          />
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
        </div>
      </header>

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
    </div>
  );
}
