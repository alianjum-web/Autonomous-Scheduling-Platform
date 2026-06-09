"use client";

import { useCallback, useEffect, useState } from "react";

export const AUTH_EMAIL_COOLDOWN_SECONDS = 60;

function storageKey(action: string, email: string) {
  return `auth-email-cooldown:${action}:${email.trim().toLowerCase()}`;
}

function readCooldownSeconds(action: string, email: string): number {
  if (!email) return 0;
  const raw = sessionStorage.getItem(storageKey(action, email));
  if (!raw) return 0;
  const remaining = Math.ceil((Number(raw) - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

/** Client-side 60s cooldown — pairs with backend Redis limits. */
export function useAuthEmailCooldown(action: string, email: string) {
  const [tick, setTick] = useState(0);
  const secondsLeft = readCooldownSeconds(action, email);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft, tick]);

  const startCooldown = useCallback(
    (seconds = AUTH_EMAIL_COOLDOWN_SECONDS) => {
      if (!email) return;
      sessionStorage.setItem(storageKey(action, email), String(Date.now() + seconds * 1000));
      setTick((n) => n + 1);
    },
    [action, email],
  );

  return {
    secondsLeft,
    canSend: secondsLeft === 0,
    startCooldown,
  };
}
