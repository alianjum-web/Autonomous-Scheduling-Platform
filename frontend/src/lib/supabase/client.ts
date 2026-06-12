import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder-anon-key";

function isConfigured(url: string | undefined, key: string | undefined): boolean {
  if (!url || !key) return false;
  if (url.includes("your-project") || url.includes("placeholder")) return false;
  if (key.includes("your-anon") || key.includes("placeholder")) return false;
  return true;
}

function resolveSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isConfigured(url, key)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[supabase] Missing or placeholder Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.development, then restart `npm run dev`.",
      );
    }
    return { url: PLACEHOLDER_URL, key: PLACEHOLDER_KEY };
  }

  return { url: url!, key: key! };
}

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Singleton browser client — avoids duplicate auth listeners and refresh races. */
export function createClient() {
  if (!browserClient) {
    const { url, key } = resolveSupabaseConfig();
    browserClient = createBrowserClient<Database>(url, key);
  }
  return browserClient;
}
