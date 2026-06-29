import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Mood } from "@prisma/client";

const VALID_MOODS: Mood[] = ["HYPNOTIC","EUPHORIC","TRIBAL","FLOATING","DARK","MELANCHOLIC","RAW","COSMIC","COFFEE"];

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  const { searchParams } = new URL(req.url);

  const mood = searchParams.get("mood") as Mood | null;
  const sort = searchParams.get("sort") ?? "new"; // "new" | "trending"
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);
  const cursor = searchParams.get("cursor") ?? undefined;

  const sets = await db.set.findMany({
    where: {
      status: "READY",
      ...(mood && VALID_MOODS.includes(mood) ? { mood } : {}),
    },
    orderBy: sort === "trending"
      ? [{ likes: { _count: "desc" } }, { createdAt: "desc" }]
      : { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true },
      },
      _count: { select: { likes: true } },
      ...(userId
        ? { likes: { where: { userId }, select: { userId: true } } }
        : {}),
    },
  });

  const hasMore = sets.length > limit;
  const items = hasMore ? sets.slice(0, limit) : sets;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const result = items.map((s) => {
    const { _count, likes, ...rest } = s as typeof s & {
      _count: { likes: number };
      likes?: { userId: string }[];
    };
    return {
      ...rest,
      likesCount: _count.likes,
      isLiked: userId ? (likes?.length ?? 0) > 0 : false,
    };
  });

  return NextResponse.json({ sets: result, nextCursor });
}
