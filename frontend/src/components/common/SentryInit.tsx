"use client";

import { useEffect } from "react";

import { sanitizePHI } from "@/lib/sanitizePHI";

export function SentryInit() {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;

    void import("@sentry/nextjs").then((Sentry) => {
      if (Sentry.getClient()) return;

      Sentry.init({
        dsn,
        environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "development",
        sendDefaultPii: false,
        beforeSend(event) {
          if (event.message) {
            event.message = sanitizePHI(event.message);
          }
          if (event.exception?.values) {
            for (const exc of event.exception.values) {
              if (exc.value) exc.value = sanitizePHI(exc.value);
            }
          }
          return event;
        },
      });
    });
  }, []);

  return null;
}
