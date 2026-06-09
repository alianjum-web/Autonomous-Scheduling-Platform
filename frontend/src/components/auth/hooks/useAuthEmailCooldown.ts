"use client";

import { useCallback, useEffect, useState } from "react";

export const AUTH_EMAIL_COOLDOWN_SECONDS = 60;

function storageKey(action: string, email: string) {
  return `auth-email-cooldown:${action}:${email.trim().toLowerCase()}`;
}

/** Client-side 60s cooldown — pairs with backend Redis limits. */
export function useAuthEmailCooldown(action: string, email: string) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  const syncFromStorage = useCallback(() => {
    if (!email) {
      setSecondsLeft(0);
      return;
    }
    const raw = sessionStorage.getItem(storageKey(action, email));
    if (!raw) {
      setSecondsLeft(0);
      return;
    }
    const remaining = Math.ceil((Number(raw) - Date.now()) / 1000);
    setSecondsLeft(remaining > 0 ? remaining : 0);
  }, [action, email]);

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const startCooldown = useCallback(
    (seconds = AUTH_EMAIL_COOLDOWN_SECONDS) => {
      if (!email) return;
      sessionStorage.setItem(storageKey(action, email), String(Date.now() + seconds * 1000));
      setSecondsLeft(seconds);
    },
    [action, email],
  );

  return {
    secondsLeft,
    canSend: secondsLeft === 0,
    startCooldown,
  };
}
