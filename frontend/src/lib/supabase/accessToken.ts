import { selectAccessToken } from "@/components/auth/store/authSelectors";
import type { RootState } from "@/components/common/store";
import { createClient } from "@/lib/supabase/client";

/** Prefer Redux token; fall back to Supabase session before bootstrap completes. */
export async function readAccessToken(getState?: () => RootState): Promise<string | null> {
  if (getState) {
    const token = selectAccessToken(getState());
    if (token) return token;
  }

  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ?? null;
}
