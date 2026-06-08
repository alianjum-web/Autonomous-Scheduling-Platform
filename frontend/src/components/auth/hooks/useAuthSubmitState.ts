"use client";

import { useCallback, useState } from "react";

export function useAuthSubmitState() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clearMessages = useCallback(() => {
    setSubmitError(null);
    setSuccessMessage(null);
  }, []);

  return {
    submitError,
    setSubmitError,
    successMessage,
    setSuccessMessage,
    loading,
    setLoading,
    clearMessages,
  };
}
