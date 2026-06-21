import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const mood = searchParams.get("mood") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);

  if (q.length < 2 && !mood) {
    return NextResponse.json({ sets: [], artists: [] });
  }

  const moodFilter = mood ? { mood: mood as import("@prisma/client").Mood } : {};

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
      },
    }),
    db.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true },
    }),
  ]);

  const setsResult = sets.map(({ _count, ...s }) => ({
    ...s,
    likesCount: _count.likes,
    isLiked: false,
  }));

  return NextResponse.json({ sets: setsResult, artists });
}
