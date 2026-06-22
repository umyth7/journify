import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/sets/[id]/play
 *
 * Fire-and-forget play count increment.
 * - No auth required (anonymous plays counted too)
 * - Uses atomic increment to avoid race conditions
 * - Returns { playsCount } after increment
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Raw update to avoid regenerating Prisma client before deploy
    await db.$executeRaw`
      UPDATE "Set"
      SET "playsCount" = "playsCount" + 1
      WHERE id = ${params.id} AND status = 'READY'
    `;
    const result = await db.$queryRaw<[{ playsCount: number }]>`
      SELECT "playsCount" FROM "Set" WHERE id = ${params.id}
    `;
    return NextResponse.json({ playsCount: result[0]?.playsCount ?? 0 });
  } catch {
    // Set not found or DB error — silently ignore
    return NextResponse.json({ playsCount: 0 });
  }
}
