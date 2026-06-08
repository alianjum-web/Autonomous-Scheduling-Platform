import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl" | "full";
}

const maxWidthClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
} as const;

export function PageShell({ children, className, maxWidth = "full" }: PageShellProps) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 sm:px-6", maxWidthClass[maxWidth], className)}>
      {children}
    </div>
  );
}
