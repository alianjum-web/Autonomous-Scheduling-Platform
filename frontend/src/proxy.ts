import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  classifyRoute,
  normalizeProfileRole,
  postAuthDestination,
  resolveRoleRedirect,
  type ProxyProfile,
} from "@/lib/proxy/roleAccess";

/** Preserve Supabase session cookies when proxy returns a redirect (avoids silent sign-out). */
function redirectWithSessionCookies(url: URL, sessionResponse: NextResponse): NextResponse {
  const redirectResponse = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach(({ name, value }) => {
    redirectResponse.cookies.set(name, value);
  });
  return redirectResponse;
}

async function loadProxyProfile(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<ProxyProfile | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  return {
    tenant_id: profile.tenant_id ?? null,
    role: normalizeProfileRole(profile.role),
  };
}

async function loadTenantSlug(
  supabase: ReturnType<typeof createServerClient>,
  tenantId: string,
): Promise<string | null> {
  const { data: tenant } = await supabase
    .from("tenants")
    .select("slug")
    .eq("id", tenantId)
    .maybeSingle();

  return tenant?.slug ?? null;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project")
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : "https://placeholder.supabase.co";
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("your-anon")
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : "placeholder-anon-key";

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll(): ReturnType<NextRequest["cookies"]["getAll"]> {
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
  const host = request.headers.get("host") ?? "";
  const subdomain = host.split(".")[0];

  supabaseResponse.headers.set("x-tenant-slug", subdomain);

  const { isAuthRoute, isPublic, needsAuth } = classifyRoute(pathname);

  if (needsAuth && !user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return redirectWithSessionCookies(url, supabaseResponse);
  }

  if (user && !isAuthRoute && !isPublic) {
    const profile = await loadProxyProfile(supabase, user.id);

    let tenantSlug: string | null = null;
    if (profile?.tenant_id && profile.role === "patient") {
      tenantSlug = await loadTenantSlug(supabase, profile.tenant_id);
    }

    const redirect = resolveRoleRedirect(pathname, profile, { needsAuth, tenantSlug });
    if (redirect) {
      return redirectWithSessionCookies(new URL(redirect.destination, request.url), supabaseResponse);
    }
  }

  if (user && pathname === "/onboarding") {
    const profile = await loadProxyProfile(supabase, user.id);
    if (profile?.tenant_id) {
      return redirectWithSessionCookies(
        new URL(postAuthDestination(profile), request.url),
        supabaseResponse,
      );
    }
  }

  if (user && (pathname === "/sign-in" || pathname === "/sign-up")) {
    const profile = await loadProxyProfile(supabase, user.id);
    const invite = request.nextUrl.searchParams.get("invite");
    if (pathname === "/sign-up" && invite) {
      return supabaseResponse;
    }
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
