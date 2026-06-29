/**
 * Shared constants.
 * TASK-010: Centralise base URL so env var controls it in all environments.
 * Set NEXT_PUBLIC_BASE_URL in Vercel / Railway before deploy.
 * TASK-022: Canonical brand name — single source of truth.
 */

/** Canonical brand name. Use this everywhere instead of hardcoded strings. */
export const APP_NAME = "SensSetify";

export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.senssetify.com";
