"use client";

import { useRouter } from "next/navigation";

import { useRoleGuard } from "@/components/common/hooks/useRoleGuard";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import { resetFeatureState } from "@/components/common/store/resetFeatureState";
import {
  useAcknowledgeBAAMutation,
  useGetBAAStatusQuery,
  useGetUserProfileQuery,
} from "@/components/common/store/settingsApi";
import { useAppDispatch } from "@/components/common/store/hooks";
import { showToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

export function useSettingsActions() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { session } = useAuthSession();
  const { isOwner } = useRoleGuard();
  const { data: profile } = useGetUserProfileQuery(undefined, { skip: !session });
  const { data: baaStatus, isLoading: baaLoading } = useGetBAAStatusQuery(undefined, {
    skip: !session,
  });
  const [acknowledgeBAA, { isLoading: acknowledgingBAA }] = useAcknowledgeBAAMutation();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    resetFeatureState(dispatch);
    router.push("/");
    router.refresh();
  };

  const handleAcknowledgeBAA = async () => {
    try {
      await acknowledgeBAA().unwrap();
      showToast({
        title: "BAA acknowledged",
        description: "AI triage and document embedding are now enabled for your clinic.",
      });
    } catch {
      showToast({
        title: "Could not acknowledge BAA",
        description: "Only clinic admins can enable AI features.",
        variant: "destructive",
      });
    }
  };

  return {
    session,
    profile,
    isOwner,
    baaStatus,
    baaLoading,
    acknowledgingBAA,
    handleSignOut,
    handleAcknowledgeBAA,
  };
}
