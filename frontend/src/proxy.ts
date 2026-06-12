import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { extractTenantSlugFromHost } from "@/lib/proxy/extractTenantSlug";
import {
  classifyRoute,
  postAuthDestination,
  resolveRoleRedirect,
  toProxyProfile,
  type ProxyProfile,
} from "@/lib/proxy/roleAccess";
import { requireSupabaseEnv } from "@/lib/supabase/requireSupabaseEnv";
import { PROFILE_ROUTING_SELECT } from "@/types/supabase-profile";

/** Preserve Supabase session cookies when proxy returns a redirect (avoids silent sign-out). */
function redirectWithSessionCookies(url: URL, sessionResponse: NextResponse): NextResponse {
  const redirectResponse = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

async function loadProxyProfile(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<ProxyProfile | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_ROUTING_SELECT)
    .eq("id", userId)
    .maybeSingle();

  return toProxyProfile(profile);
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const { url: supabaseUrl, key: supabaseKey } = requireSupabaseEnv();

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet): void {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const tenantSlug = extractTenantSlugFromHost(request.headers.get("host") ?? "");
  if (tenantSlug) {
    supabaseResponse.headers.set("x-tenant-slug", tenantSlug);
  }

  const { isAuthRoute, isPublic, needsAuth } = classifyRoute(pathname);

  if (needsAuth && !user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return redirectWithSessionCookies(url, supabaseResponse);
  }

  let profilePromise: Promise<ProxyProfile | null> | null = null;
  const getProfile = (): Promise<ProxyProfile | null> => {
    if (!user) return Promise.resolve(null);
    profilePromise ??= loadProxyProfile(supabase, user.id);
    return profilePromise;
  };

  if (user && !isAuthRoute && !isPublic) {
    const profile = await getProfile();
    const redirect = resolveRoleRedirect(pathname, profile, { needsAuth });
    if (redirect) {
      return redirectWithSessionCookies(new URL(redirect.destination, request.url), supabaseResponse);
    }
  }

  if (user && pathname === "/onboarding") {
    const profile = await getProfile();
    if (profile?.tenant_id) {
      return redirectWithSessionCookies(
        new URL(postAuthDestination(profile), request.url),
        supabaseResponse,
      );
    }
  }

  if (user && (pathname === "/sign-in" || pathname === "/sign-up")) {
    const invite = request.nextUrl.searchParams.get("invite");
    if (pathname === "/sign-up" && invite) {
      return supabaseResponse;
    }
    const profile = await getProfile();
    return redirectWithSessionCookies(
      new URL(postAuthDestination(profile), request.url),
      supabaseResponse,
    );
  }

  return supabaseResponse;
}

export const config: { matcher: string[] } = {
  matcher: ["/((?!_next|favicon.ico|icon|apple-icon|api/).*)"],
};
