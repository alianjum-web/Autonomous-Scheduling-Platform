import type { AuthEmailAction } from "@/lib/auth/emailApi";

type AuthEmailEvent = "sent" | "failed" | "rate_limited";

/** Fire-and-forget Sentry breadcrumb for auth email flows (no full email in tags). */
export function captureAuthEmailEvent(
  action: AuthEmailAction,
  event: AuthEmailEvent,
  email?: string,
) {
  const emailDomain = email?.includes("@") ? email.split("@")[1] : undefined;

  void import("@sentry/nextjs")
    .then((Sentry) => {
      if (!Sentry.getClient()) return;
      Sentry.addBreadcrumb({
        category: "auth.email",
        message: `auth_email_${event}`,
        level: event === "failed" ? "warning" : "info",
        data: { action, event, email_domain: emailDomain },
      });
      if (event === "rate_limited") {
        Sentry.captureMessage(`Auth email rate limited: ${action}`, "warning");
      }
    })
    .catch(() => undefined);
}
