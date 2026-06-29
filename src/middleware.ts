import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sets/(.*)",
  "/profile/(.*)",
  "/search(.*)",
  "/login(.*)",
  "/register(.*)",
  "/api/sets(.*)",
  "/api/audio(.*)",
  "/api/search(.*)",
  "/api/webhooks(.*)",
]);

// ---------------------------------------------------------------------------
// CSRF — Origin header check for mutating requests (TASK-015)
// ---------------------------------------------------------------------------
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Build the set of allowed origins at startup.
 * Localhost is always permitted in non-production environments so that
 * `next dev` works without extra config.
 */
function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>([
    "https://www.senssetify.com",
    "https://senssetify.com",
  ]);
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    origins.add(process.env.NEXT_PUBLIC_BASE_URL);
  }
  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
  }
  return origins;
}

const ALLOWED_ORIGINS = buildAllowedOrigins();

/**
 * Returns true if the request is safe to process (no CSRF risk).
 * Rules:
 *  1. Non-mutating methods (GET, HEAD, OPTIONS) are always safe.
 *  2. Clerk webhook endpoint: Svix verifies the signature itself.
 *  3. Server-to-worker calls authenticated via x-worker-secret.
 *  4. If no Origin header: allow (server-to-server / curl / Postman).
 *  5. If Origin header present but not in allowed list: reject (CSRF attempt).
 */
function isCsrfSafe(req: Request): boolean {
  if (!MUTATION_METHODS.has(req.method.toUpperCase())) return true;

  const pathname = new URL(req.url).pathname;

  // Webhooks use their own signature verification
  if (pathname.startsWith("/api/webhooks")) return true;
  // Worker-to-API calls carry x-worker-secret
  if (req.headers.get("x-worker-secret")) return true;

  const origin = req.headers.get("origin");
  // No Origin header — treat as server-to-server / non-browser call
  if (!origin) return true;

  return ALLOWED_ORIGINS.has(origin);
}

export default clerkMiddleware(async (auth, req) => {
  if (!isCsrfSafe(req)) {
    return NextResponse.json({ error: "Forbidden: invalid origin" }, { status: 403 });
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
