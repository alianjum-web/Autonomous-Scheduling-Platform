import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
}

const maxWidthClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
} as const;

export function PageShell({ children, className, maxWidth = "full" }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col px-4 py-8 sm:px-6 sm:py-10",
        maxWidthClass[maxWidth],
        className,
      )}
    >
      {children}
    </div>
  );
}
