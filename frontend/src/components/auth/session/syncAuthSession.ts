import type { Dispatch, UnknownAction } from "@reduxjs/toolkit";
import type { Session } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { fetchUserProfile } from "@/lib/supabase/profile";
import { refreshAuthSessionOnce } from "@/lib/supabase/sessionRefresh";
import type { UserProfileFetchResult } from "@/types/supabase-profile";

import { sessionMissingProfileClaims } from "@/components/auth/store/authState";
import { setSession } from "@/components/auth/store/authSlice";

type AuthSyncDispatch = Dispatch<UnknownAction>;

let syncInFlight: Promise<UserProfileFetchResult | null> | null = null;
let tenantRefreshAttemptedForUserId: string | null = null;

/** Reset sync guards after sign-out. */
export function resetAuthSyncState(): void {
  tenantRefreshAttemptedForUserId = null;
}

async function runAuthSync(
  dispatch: AuthSyncDispatch,
  session: Session | null,
): Promise<UserProfileFetchResult | null> {
  if (!session?.user) {
    dispatch(setSession(null));
    return null;
  }

  const profileData = await fetchUserProfile(session.user);
  const profile = profileData?.profile ?? null;

  dispatch(
    setSession({
      session,
      profile,
    }),
  );

  const alreadyAttempted = tenantRefreshAttemptedForUserId === session.user.id;
  if (sessionMissingProfileClaims(session, profile) && !alreadyAttempted) {
    tenantRefreshAttemptedForUserId = session.user.id;
    const refreshed = await refreshAuthSessionOnce(createClient());
    if (refreshed) {
      dispatch(
        setSession({
          session: refreshed,
          profile,
        }),
      );
    }
  }

  return profileData;
}

/** Coalesced auth sync — safe to call from bootstrap, sign-in, and invite accept. */
export async function syncAuthSession(
  dispatch: AuthSyncDispatch,
  session: Session | null,
): Promise<UserProfileFetchResult | null> {
  syncInFlight ??= runAuthSync(dispatch, session).finally(() => {
    syncInFlight = null;
  });
  return syncInFlight;
}
