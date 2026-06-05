"use client";

import { useAuthSession } from "@/hooks/useAuthSession";

const ADMIN_ROLES = new Set(["admin", "clinic_admin"]);

export function useAdminGuard() {
  const { session, loading, accessToken } = useAuthSession();

  let clinicRole: string | null = null;
  if (session?.user?.app_metadata?.role) {
    clinicRole = session.user.app_metadata.role as string;
  } else if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1] ?? ""));
      clinicRole = payload.clinic_role ?? payload.app_metadata?.role ?? null;
    } catch {
      clinicRole = null;
    }
  }

  const isAdmin = clinicRole ? ADMIN_ROLES.has(clinicRole) : false;

  return { loading, isAdmin, clinicRole };
}
