"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variant === "primary" &&
            "bg-violet-500 text-white hover:bg-violet-600 active:bg-violet-700",
          variant === "ghost" &&
            "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 active:bg-zinc-700",
          variant === "outline" &&
            "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 active:bg-zinc-800",
          variant === "danger" &&
            "bg-red-500/10 text-red-400 hover:bg-red-500/20 active:bg-red-500/30",
          size === "sm" && "text-xs px-3 py-1.5 rounded-md min-h-[32px]",
          size === "md" && "text-sm px-4 py-2.5 rounded-lg min-h-[40px]",
          size === "lg" && "text-sm px-6 py-3 rounded-lg min-h-[44px]",
          size === "icon" && "w-11 h-11 rounded-lg p-0",
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
