import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [sets, followersCount] = await Promise.all([
    db.set.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        genre: true,
        mood: true,
        status: true,
        playsCount: true,
        coverUrl: true,
        createdAt: true,
        _count: { select: { likes: true } },
      },
    }),
    db.follow.count({ where: { followingId: userId } }),
  ]);

  const totalPlays = sets.reduce((sum, s) => sum + s.playsCount, 0);
  const totalLikes = sets.reduce((sum, s) => sum + s._count.likes, 0);

  return NextResponse.json({
    stats: {
      totalPlays,
      totalLikes,
      totalFollowers: followersCount,
      totalSets: sets.length,
    },
    sets: sets.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      genre: s.genre,
      mood: s.mood,
      status: s.status,
      playsCount: s.playsCount,
      likesCount: s._count.likes,
      coverUrl: s.coverUrl,
      createdAt: s.createdAt,
    })),
  });
}
