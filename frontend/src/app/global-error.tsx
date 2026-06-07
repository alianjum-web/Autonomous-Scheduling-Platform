"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="page-gradient flex min-h-screen flex-col items-center justify-center px-4 text-center font-sans antialiased">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <AlertTriangle className="size-8" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Application error</h1>
        <p className="mt-2 max-w-md text-sm text-neutral-600">
          {error.message || "A critical error occurred. Please refresh or return home."}
        </p>
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center rounded-md bg-teal-700 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-800"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Go home
          </Link>
        </div>
      </body>
    </html>
  );
}
