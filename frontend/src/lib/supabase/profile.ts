import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import {
  PROFILE_CLIENT_SELECT,
  type UserProfileFetchResult,
} from "@/types/supabase-profile";

/** Load signed-in user + profile for client auth state and settings. */
export async function fetchUserProfile(user?: User): Promise<UserProfileFetchResult | null> {
  const supabase = createClient();
  const resolvedUser =
    user ??
    (await supabase.auth.getUser()).data.user ??
    null;
  if (!resolvedUser) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_CLIENT_SELECT)
    .eq("id", resolvedUser.id)
    .maybeSingle();

  return {
    user: resolvedUser,
    profile: profile as UserProfileFetchResult["profile"],
  };
}
