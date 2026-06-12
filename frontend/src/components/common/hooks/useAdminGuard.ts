"use client";

import { selectAuthLoading, selectClinicRole, selectIsStaff } from "@/components/auth/store/authSelectors";
import { useAppSelector } from "@/components/common/store/hooks";
import type { UseAdminGuardReturn } from "@/types/hooks";

export function useAdminGuard(): UseAdminGuardReturn {
  const loading = useAppSelector(selectAuthLoading);
  const isStaff = useAppSelector(selectIsStaff);
  const clinicRole = useAppSelector(selectClinicRole);

  return { loading, isAdmin: isStaff, clinicRole };
}
