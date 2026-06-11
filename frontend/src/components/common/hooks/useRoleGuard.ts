"use client";

import {
  selectAuthLoading,
  selectClinicRole,
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
  isDoctor: boolean;
  isStaff: boolean;
  /** @deprecated Use isStaff */
  isAdmin: boolean;
}

export function useRoleGuard(): UseRoleGuardReturn {
  const loading = useAppSelector(selectAuthLoading);
  const clinicRole = useAppSelector(selectClinicRole);
  const isOwner = useAppSelector(selectIsOwner);
  const isDoctor = useAppSelector(selectIsDoctor);
  const isStaff = useAppSelector(selectIsStaff);

  return { loading, clinicRole, isOwner, isDoctor, isStaff, isAdmin: isStaff };
}
