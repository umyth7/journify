/**
 * Shared dashboard data fetcher.
 * Used by both the server-component page (`/dashboard`) and the API route (`/api/dashboard`).
 * TASK-007: Eliminates duplicated DB queries between the two.
 */

import { db } from "@/lib/db";
import type { DashboardSet } from "@/components/dashboard/DashboardClient";

export async function getDashboardData(userId: string) {
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

  return {
    stats: {
      totalPlays,
      totalLikes,
      totalFollowers: followersCount,
      totalSets: sets.length,
    },
    sets: sets.map((s) => ({
      ...s,
      likesCount: s._count.likes,
      createdAt: s.createdAt.toISOString(),
    })) as DashboardSet[],
  };
}
