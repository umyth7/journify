"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * TASK-020: Error boundary for the main app layout.
 * Catches unexpected render/data errors and shows a safe fallback UI.
 */
export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[main error boundary]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] py-16 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Something went wrong</h2>
        <p className="text-sm text-zinc-500 mt-1 max-w-xs mx-auto">
          An unexpected error occurred. Please try again.
        </p>
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-500 text-white hover:bg-violet-600 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
