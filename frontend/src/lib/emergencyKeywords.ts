/**
 * Layer 1: Client-side deterministic emergency detection.
 * Mirrors backend DEFAULT_PATTERNS — sub-50ms, no network call.
 * This list is a fallback; authoritative check is server-side.
 */

export const EMERGENCY_LEGAL_DISCLAIMER =
  "This AI assistant cannot provide medical advice. In any emergency, call 911 immediately.";

const DEFAULT_PATTERNS: RegExp[] = [
  /\bchest\s+pain\b/i,
  /\bcant\s+breathe\b/i,
  /\bcannot\s+breathe\b/i,
  /\bshortness\s+of\s+breath\b/i,
  /\bstroke\b/i,
  /\bheart\s+attack\b/i,
  /\bseizure\b/i,
  /\bunconscious\b/i,
  /\bpassing\s+out\b/i,
  /\bsevere\s+bleeding\b/i,
  /\boverdose\b/i,
  /\bsuicid/i,
  /\bcan't\s+feel\b/i,
  /\bnumbness\b.*\bface\b/i,
  /\b911\b/,
  /\bemergency\b.*\broom\b/i,
  /\bER\b/,
];

export function detectEmergencyKeywords(text: string): boolean {
  if (!text.trim()) return false;
  return DEFAULT_PATTERNS.some((pattern) => pattern.test(text));
}
