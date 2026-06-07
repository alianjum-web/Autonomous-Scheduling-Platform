import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function pageMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: {
      title: `${title} · Autonomous Scheduling`,
      description,
      type: "website",
      url: SITE_URL,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Autonomous Scheduling`,
      description,
    },
  };
}
