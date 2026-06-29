import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_MOODS = [
  "HYPNOTIC",
  "EUPHORIC",
  "TRIBAL",
  "FLOATING",
  "DARK",
  "MELANCHOLIC",
  "RAW",
  "COSMIC",
  "COFFEE",
] as const;
type ValidMood = (typeof VALID_MOODS)[number];

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const mood = searchParams.get("mood") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);

  if (q.length < 2 && !mood) {
    return NextResponse.json({ sets: [], artists: [] });
  }

  const validMood = VALID_MOODS.includes(mood as ValidMood) ? (mood as ValidMood) : null;
  const moodFilter = validMood ? { mood: validMood } : {};

  const artistQuery = q.length >= 2
    ? db.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true },
      })
    : Promise.resolve([]);

  const [sets, artists] = await Promise.all([
    db.set.findMany({
      where: {
        status: "READY",
        ...moodFilter,
        ...(q.length >= 2 ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { genre: { contains: q, mode: "insensitive" } },
          ],
        } : {}),
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true } },
        _count: { select: { likes: true } },
        ...(userId
          ? { likes: { where: { userId }, select: { userId: true } } }
          : {}),
      },
    }),
    artistQuery,
  ]);

  const setsResult = sets.map((s) => {
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

  return NextResponse.json({ sets: setsResult, artists });
}
