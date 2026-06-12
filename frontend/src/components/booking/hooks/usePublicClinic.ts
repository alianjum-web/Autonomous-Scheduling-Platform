"use client";

import { useEffect, useState } from "react";

import type { PublicClinic } from "@/lib/booking/publicClinicApi";
import { fetchPublicClinic } from "@/lib/booking/publicClinicApi";

export function usePublicClinic(slug: string) {
  const [clinic, setClinic] = useState<PublicClinic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicClinic(slug)
      .then((data) => {
        if (!cancelled) {
          setClinic(data);
          setError(null);
          setLoadedSlug(slug);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setClinic(null);
          setError(err instanceof Error ? err.message : "Failed to load clinic");
          setLoadedSlug(slug);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const loading = loadedSlug !== slug;

  return { clinic, loading, error };
}
