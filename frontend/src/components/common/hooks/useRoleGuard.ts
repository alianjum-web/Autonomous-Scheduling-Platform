"use client";

import {
  selectAuthLoading,
  selectClinicRole,
  selectIsClinicManager,
  selectIsDoctor,
  selectIsOwner,
  selectIsStaff,
} from "@/components/auth/store/authSelectors";
import { useAppSelector } from "@/components/common/store/hooks";
import type { ClinicRole } from "@/types/auth";

export interface UseRoleGuardReturn {
  loading: boolean;
  clinicRole: ClinicRole | null;
  isOwner: boolean;
  isClinicManager: boolean;
  isDoctor: boolean;
  isStaff: boolean;
  /** @deprecated Use isStaff */
  isAdmin: boolean;
}

export function useRoleGuard(): UseRoleGuardReturn {
  const loading = useAppSelector(selectAuthLoading);
  const clinicRole = useAppSelector(selectClinicRole);
  const isOwner = useAppSelector(selectIsOwner);
  const isClinicManager = useAppSelector(selectIsClinicManager);
  const isDoctor = useAppSelector(selectIsDoctor);
  const isStaff = useAppSelector(selectIsStaff);

  return { loading, clinicRole, isOwner, isClinicManager, isDoctor, isStaff, isAdmin: isStaff };
}
