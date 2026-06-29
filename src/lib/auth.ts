/**
 * Auth abstraction layer.
 * TASK-021: Thin wrapper over Clerk so that the rest of the codebase doesn't
 * import directly from "@clerk/nextjs/server". When we eventually migrate away
 * from Clerk, only this file and the Clerk-specific middleware need to change.
 *
 * Usage:
 *   import { getCurrentUserId, requireAuth } from "@/lib/auth";
 *
 *   // Returns userId or null (unauthenticated allowed)
 *   const userId = await getCurrentUserId();
 *
 *   // Returns userId, throws 401-equivalent if unauthenticated
 *   const userId = await requireAuth();  // call inside a try/catch or let Next handle it
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/** Returns the authenticated user's ID, or null if not signed in. */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Returns the authenticated user's ID.
 * Returns a 401 NextResponse if not signed in — callers should return this directly.
 *
 * @example
 * const result = await requireAuth();
 * if (result instanceof NextResponse) return result;
 * const userId = result;
 */
export async function requireAuth(): Promise<string | NextResponse> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return userId;
}
