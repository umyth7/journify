import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Headphones, Heart, Users, Music } from "lucide-react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { DashboardClient, type DashboardSet } from "@/components/dashboard/DashboardClient";

export const metadata: Metadata = { title: "Dashboard — Senssetify" };

async function getDashboardData(userId: string) {
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
    stats: { totalPlays, totalLikes, totalFollowers: followersCount, totalSets: sets.length },
    sets: sets.map((s) => ({
      ...s,
      likesCount: s._count.likes,
      createdAt: s.createdAt.toISOString(),
    })) as DashboardSet[],
  };
}

const STAT_CARDS = [
  { key: "totalPlays", label: "Total Plays", icon: Headphones, color: "text-violet-400" },
  { key: "totalLikes", label: "Total Likes", icon: Heart, color: "text-pink-400" },
  { key: "totalFollowers", label: "Followers", icon: Users, color: "text-sky-400" },
  { key: "totalSets", label: "Sets", icon: Music, color: "text-amber-400" },
] as const;

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const { stats, sets } = await getDashboardData(userId);

  return (
    <div className="py-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-syne text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Your stats and upload management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <Icon className={`w-5 h-5 mb-2 ${color}`} />
            <p className="text-2xl font-bold text-zinc-100 font-syne">
              {stats[key].toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Set management */}
      <div>
        <h2 className="text-base font-semibold text-zinc-100 mb-4">Your Sets</h2>
        <DashboardClient initialSets={sets} />
      </div>
    </div>
  );
}
