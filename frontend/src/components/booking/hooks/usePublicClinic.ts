"use client";

import { useEffect, useState } from "react";

import type { PublicClinic } from "@/lib/booking/publicClinicApi";
import { fetchPublicClinic } from "@/lib/booking/publicClinicApi";

export function usePublicClinic(slug: string) {
  const [clinic, setClinic] = useState<PublicClinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchPublicClinic(slug)
      .then((data) => {
        if (!cancelled) {
          setClinic(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setClinic(null);
          setError(err instanceof Error ? err.message : "Failed to load clinic");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { clinic, loading, error };
}
