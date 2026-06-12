import type { Session, SupabaseClient } from "@supabase/supabase-js";

/** Minimum gap between explicit refresh calls — avoids Supabase 429 rate limits. */
const MIN_REFRESH_INTERVAL_MS = 30_000;

let refreshInFlight: Promise<Session | null> | null = null;
let lastRefreshAt = 0;

/**
 * Refresh the Supabase session at most once per interval, coalescing concurrent callers.
 * On failure, returns the current session instead of null so Redux auth state is preserved.
 */
export async function refreshAuthSessionOnce(
  supabase: SupabaseClient,
): Promise<Session | null> {
  const now = Date.now();
  if (now - lastRefreshAt < MIN_REFRESH_INTERVAL_MS) {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) { // supabase threw
        const { data: current } = await supabase.auth.getSession();
        return current.session;
      }
      lastRefreshAt = Date.now();
      return data.session;
    } catch { // something threw before/during call
      const { data: current } = await supabase.auth.getSession();
      return current.session;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Call after sign-in / invite accept when a fresh JWT is required immediately. */
export function resetSessionRefreshThrottle(): void {
  lastRefreshAt = 0;
}
