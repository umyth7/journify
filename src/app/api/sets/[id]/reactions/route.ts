import { getCurrentUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

const ALLOWED_EMOJIS = ["🔥", "❤️", "🌀", "✨", "🌍", "🌊"];

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();

  const rows = await db.reaction.groupBy({
    by: ["emoji"],
    where: { setId: params.id },
    _count: { emoji: true },
  });

  const userReactions = userId
    ? await db.reaction.findMany({ where: { setId: params.id, userId }, select: { emoji: true } })
    : [];
  const userEmojiSet = new Set(userReactions.map((r) => r.emoji));

  const reactions = ALLOWED_EMOJIS.map((emoji) => {
    const found = rows.find((r) => r.emoji === emoji);
    return { emoji, count: found?._count.emoji ?? 0, isReacted: userEmojiSet.has(emoji) };
  });

  return NextResponse.json({ reactions });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { emoji } = await req.json();
  if (!ALLOWED_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  // TASK-005: Validate set exists before touching reactions
  const set = await db.set.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!set) return NextResponse.json({ error: "Set not found" }, { status: 404 });

  // TASK-002: Optimistic create — catch P2002 and delete instead
  // Avoids TOCTOU race where two concurrent requests both read "not reacted" and both try to create
  try {
    await db.reaction.create({ data: { userId, setId: params.id, emoji } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // Already reacted — delete (toggle off)
      await db.reaction.delete({
        where: { userId_setId_emoji: { userId, setId: params.id, emoji } },
      });
    } else {
      throw err;
    }
  }

  const rows = await db.reaction.groupBy({
    by: ["emoji"],
    where: { setId: params.id },
    _count: { emoji: true },
  });

  const userReactions = await db.reaction.findMany({
    where: { setId: params.id, userId },
    select: { emoji: true },
  });
  const userEmojiSet = new Set(userReactions.map((r) => r.emoji));

  const reactions = ALLOWED_EMOJIS.map((e) => {
    const found = rows.find((r) => r.emoji === e);
    return { emoji: e, count: found?._count.emoji ?? 0, isReacted: userEmojiSet.has(e) };
  });

  return NextResponse.json({ reactions });
}
