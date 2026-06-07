import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder-anon-key";

function resolveSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const configured =
    url &&
    key &&
    !url.includes("your-project") &&
    !url.includes("placeholder") &&
    !key.includes("your-anon") &&
    !key.includes("placeholder");

  return {
    url: configured ? url : PLACEHOLDER_URL,
    key: configured ? key : PLACEHOLDER_KEY,
  };
}

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = resolveSupabaseConfig();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component — cookie writes are no-ops
        }
      },
    },
  });
}
