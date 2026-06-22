import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { userId } = await auth();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const mood = searchParams.get("mood") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);

  if (q.length < 2 && !mood) {
    return NextResponse.json({ sets: [], artists: [] });
  }

  const moodFilter = mood ? { mood: mood as import("@prisma/client").Mood } : {};

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
