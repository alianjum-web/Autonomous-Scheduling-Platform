"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastContextValue {
  toasts: Toast[];
  show: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let externalShow: ((toast: Omit<Toast, "id">) => void) | null = null;

export function showToast(toast: Omit<Toast, "id">) {
  externalShow?.(toast);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => dismiss(id), 8000);
  }, [dismiss]);

  externalShow = show;

  return (
    <ToastContext.Provider value={{ toasts, show, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={cn(
              "flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg",
              t.variant === "destructive"
                ? "border-destructive/50 bg-destructive/10 text-destructive"
                : "border-border bg-card text-foreground",
            )}
          >
            <div className="flex-1">
              <p className="font-medium">{t.title}</p>
              {t.description ? <p className="mt-1 text-sm opacity-90">{t.description}</p> : null}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
