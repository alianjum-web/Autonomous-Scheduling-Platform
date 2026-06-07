import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/chat",
    "/front-desk",
    "/appointments",
    "/clinic-docs",
    "/settings",
    "/help",
    "/status",
    "/privacy",
    "/terms",
    "/hipaa-notice",
    "/sign-in",
    "/sign-up",
  ];

  return routes.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
