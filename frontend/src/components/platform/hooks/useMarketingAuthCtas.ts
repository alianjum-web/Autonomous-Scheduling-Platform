"use client";

import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { selectAuthProfileReady, selectDashboardHref } from "@/components/auth/store/authSelectors";
import { useAppSelector } from "@/components/common/store/hooks";

export function useMarketingAuthCtas() {
  const { session, loading } = useAuthSession();
  const profileReady = useAppSelector(selectAuthProfileReady);
  const dashboardHref = useAppSelector(selectDashboardHref);

  return {
    session,
    loading,
    profileReady,
    dashboardHref,
    authReady: !loading && profileReady,
  };
}
