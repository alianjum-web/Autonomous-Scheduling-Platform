/** Scrub PHI before any client-side logging, Sentry, or analytics call. */

const PHI_REGEX = {
  phone: /\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
  email: /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g,
} as const;

export function sanitizePHI(text: string): string {
  return text
    .replace(PHI_REGEX.phone, "[PHONE_REDACTED]")
    .replace(PHI_REGEX.email, "[EMAIL_REDACTED]");
}
