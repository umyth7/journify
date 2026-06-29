import { getCurrentUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // TASK-005: Validate set exists before touching likes
  const set = await db.set.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!set) return NextResponse.json({ error: "Set not found" }, { status: 404 });

  let liked: boolean;

  // TASK-002: Optimistic create — catch P2002 unique constraint and delete instead
  // Avoids TOCTOU race where two concurrent requests both read "not liked" and both try to create
  try {
    await db.like.create({ data: { userId, setId: params.id } });
    liked = true;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // Already liked — delete (unlike)
      await db.like.delete({ where: { userId_setId: { userId, setId: params.id } } });
      liked = false;
    } else {
      throw err;
    }
  }

  const likesCount = await db.like.count({ where: { setId: params.id } });
  return NextResponse.json({ liked, likesCount });
}
