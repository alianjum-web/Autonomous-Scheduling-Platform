import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const subdomain = host.split(".")[0];

  const res = NextResponse.next();
  res.headers.set("x-tenant-slug", subdomain);
  return res;
}

export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
