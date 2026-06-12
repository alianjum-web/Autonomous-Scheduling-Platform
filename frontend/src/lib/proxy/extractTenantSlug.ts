const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

/** Subdomain tenant slug from Host, or empty when on apex / local / Vercel default domain. */
export function extractTenantSlugFromHost(host: string): string {
  const hostname = (host.split(":")[0] ?? "").toLowerCase();
  if (!hostname || LOCAL_HOSTS.has(hostname)) {
    return "";
  }

  if (hostname.endsWith(".vercel.app")) {
    return "";
  }

  const parts = hostname.split(".");
  if (parts.length < 3) {
    return "";
  }

  const subdomain = parts[0];
  if (!subdomain || subdomain === "www") {
    return "";
  }

  return subdomain;
}
