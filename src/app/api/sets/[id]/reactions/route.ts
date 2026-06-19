import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const ALLOWED_EMOJIS = ["🔥", "❤️", "🌀", "✨", "🌍", "🌊"];

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

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
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { emoji } = await req.json();
  if (!ALLOWED_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  const existing = await db.reaction.findUnique({
    where: { userId_setId_emoji: { userId, setId: params.id, emoji } },
  });

  if (existing) {
    await db.reaction.delete({ where: { userId_setId_emoji: { userId, setId: params.id, emoji } } });
  } else {
    await db.reaction.create({ data: { userId, setId: params.id, emoji } });
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
