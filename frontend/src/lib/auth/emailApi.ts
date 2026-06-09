const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type AuthEmailAction = "signup" | "resend" | "recover";

export class AuthEmailApiError extends Error {
  retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds = 0) {
    super(message);
    this.name = "AuthEmailApiError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

interface RateLimitBody {
  detail?: { detail?: string; retry_after_seconds?: number };
}

async function postAuthEmail<TBody extends object>(path: string, body: TBody): Promise<string> {
  const response = await fetch(`${API_BASE}/v1/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as
    | { message?: string; detail?: string | RateLimitBody["detail"] }
    | null;

  if (response.status === 429) {
    const detail = payload?.detail;
    const retryAfter =
      typeof detail === "object" && detail?.retry_after_seconds
        ? detail.retry_after_seconds
        : 60;
    const message =
      typeof detail === "object" && detail?.detail
        ? detail.detail
        : "Please wait before requesting another email.";
    throw new AuthEmailApiError(message, retryAfter);
  }

  if (!response.ok) {
    const message =
      typeof payload?.detail === "string"
        ? payload.detail
        : payload?.message ?? "Request failed. Please try again.";
    throw new AuthEmailApiError(message);
  }

  return payload?.message ?? "Success.";
}

export function signUpViaApi(input: {
  email: string;
  password: string;
  fullName: string;
  emailRedirectTo: string;
}) {
  return postAuthEmail("sign-up", {
    email: input.email,
    password: input.password,
    full_name: input.fullName,
    email_redirect_to: input.emailRedirectTo,
  });
}

export function resendVerificationViaApi(email: string, emailRedirectTo: string) {
  return postAuthEmail("resend-verification", { email, email_redirect_to: emailRedirectTo });
}

export function forgotPasswordViaApi(email: string, redirectTo: string) {
  return postAuthEmail("forgot-password", { email, redirect_to: redirectTo });
}
