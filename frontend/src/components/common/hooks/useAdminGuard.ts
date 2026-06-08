"use client";

import { selectAuthLoading, selectClinicRole, selectIsAdmin } from "@/components/auth/store/authSelectors";
import { useAppSelector } from "@/components/common/store/hooks";

export function useAdminGuard() {
  const loading = useAppSelector(selectAuthLoading);
  const isAdmin = useAppSelector(selectIsAdmin);
  const clinicRole = useAppSelector(selectClinicRole);

  return { loading, isAdmin, clinicRole };
}
