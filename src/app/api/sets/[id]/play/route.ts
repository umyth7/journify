import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes — 1 counted play per IP per set per window

/**
 * POST /api/sets/[id]/play
 *
 * Fire-and-forget play count increment.
 * - No auth required (anonymous plays counted too)
 * - IP-based rate limiting: max 1 play per set per IP per 10 minutes (DB-backed PlayLog)
 * - Uses Prisma `updateMany` + `increment` for type-safe atomic update
 *
 * TASK-035:
 * - CF-Connecting-IP checked first (Cloudflare terminates TLS before Vercel)
 * - If IP resolves to "unknown", playsCount is still incremented but no PlayLog
 *   is written — avoids all anonymous requests sharing the same rate-limit bucket.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Prefer Cloudflare's header, then standard forwarded/real-IP headers
    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    // IP unknown — increment count but skip rate-limit log (TASK-035)
    if (ip === "unknown") {
      await db.set.updateMany({
        where: { id: params.id, status: "READY" },
        data: { playsCount: { increment: 1 } },
      });
      const current = await db.set.findUnique({
        where: { id: params.id },
        select: { playsCount: true },
      });
      return NextResponse.json({ playsCount: current?.playsCount ?? 0 });
    }

    const windowStart = new Date(Date.now() - RATE_WINDOW_MS);

    // Rate limit check: already played from this IP in the last 10 minutes?
    const recentPlay = await db.playLog.findFirst({
      where: { setId: params.id, ip, createdAt: { gte: windowStart } },
      select: { id: true },
    });

    if (recentPlay) {
      // Within rate window — return current count without incrementing
      const current = await db.set.findUnique({
        where: { id: params.id },
        select: { playsCount: true },
      });
      return NextResponse.json({ playsCount: current?.playsCount ?? 0 });
    }

    // Log play and increment atomically (set must be READY to count)
    const [, updateResult] = await Promise.all([
      db.playLog.create({ data: { setId: params.id, ip } }),
      db.set.updateMany({
        where: { id: params.id, status: "READY" },
        data: { playsCount: { increment: 1 } },
      }),
    ]);

    // If updateResult.count === 0, set is not READY — still logged the attempt
    void updateResult;

    const result = await db.set.findUnique({
      where: { id: params.id },
      select: { playsCount: true },
    });

    return NextResponse.json({ playsCount: result?.playsCount ?? 0 });
  } catch {
    // DB error or set not found — silently ignore (fire-and-forget)
    return NextResponse.json({ playsCount: 0 });
  }
}
