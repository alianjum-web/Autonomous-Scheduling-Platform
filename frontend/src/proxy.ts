import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/onboarding",
  "/auth/",
];

const PUBLIC_ROUTES = ["/", "/privacy", "/terms", "/hipaa-notice", "/help", "/status"];

const PROTECTED_ROUTES = [
  "/chat",
  "/front-desk",
  "/appointments",
  "/clinic-docs",
  "/settings",
  "/onboarding",
];

const ADMIN_ROUTES = ["/front-desk", "/appointments", "/clinic-docs"];

const ADMIN_ROLES = new Set(["admin", "clinic_admin"]);

function isRouteMatch(pathname: string, routes: string[]) {
  return routes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`) ||
      (route.endsWith("/") && pathname.startsWith(route)),
  );
}

export async function proxy(request: NextRequest) {
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
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("host") ?? "";
  const subdomain = host.split(".")[0];

  supabaseResponse.headers.set("x-tenant-slug", subdomain);

  const isAuthRoute = isRouteMatch(pathname, AUTH_ROUTES);
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const needsAuth = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const needsAdmin = ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (needsAuth && !user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && !isAuthRoute && !isPublic) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.tenant_id && pathname !== "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (needsAdmin && profile?.role && !ADMIN_ROLES.has(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/chat";
      url.searchParams.set("notice", "staff_only");
      return NextResponse.redirect(url);
    }
  }

  if (user && pathname === "/onboarding") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.tenant_id) {
      return NextResponse.redirect(new URL("/chat", request.url));
    }
  }

  if (user && (pathname === "/sign-in" || pathname === "/sign-up")) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  return supabaseResponse;
}

export const config = { matcher: ["/((?!_next|favicon.ico|api/).*)"] };
