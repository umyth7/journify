import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { SetCard } from "@/components/set/SetCard";
import { FollowButton } from "@/components/profile/FollowButton";
import type { Set } from "@/types";

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const { userId } = await auth();

  const user = await db.user.findUnique({
    where: { username: params.username },
    include: {
      _count: { select: { followers: true, following: true, sets: true } },
      sets: {
        where: { status: "READY" },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { likes: true } } },
      },
    },
  });

  if (!user) notFound();

  const isOwnProfile = userId === user.id;
  const followRecord = userId && !isOwnProfile
    ? await db.follow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: user.id } },
      })
    : null;

  const likedSetIds = userId
    ? new Set(
        (await db.like.findMany({ where: { userId, setId: { in: user.sets.map((s) => s.id) } }, select: { setId: true } })).map(
          (l) => l.setId
        )
      )
    : new Set<string>();

  const displayName = user.displayName ?? user.username;

  const sets: Set[] = user.sets.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    genre: s.genre,
    mood: s.mood as Set["mood"],
    duration: s.duration,
    audioUrl: s.audioUrl,
    coverUrl: s.coverUrl,
    status: s.status as Set["status"],
    createdAt: s.createdAt,
    userId: s.userId,
    user: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl, bio: user.bio },
    likesCount: s._count.likes,
    isLiked: likedSetIds.has(s.id),
  }));

  return (
    <div className="py-10 space-y-10">
      {/* Profile header */}
      <div className="flex items-start gap-6">
        <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800 shadow-xl shadow-black/40">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={displayName} width={80} height={80} className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-300 bg-gradient-to-br from-violet-700 to-zinc-800">
              {displayName[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-zinc-100">{displayName}</h1>
              <p className="text-sm text-zinc-500">@{user.username}</p>
            </div>
            {!isOwnProfile && (
              <FollowButton
                username={user.username}
                initialFollowing={!!followRecord}
                initialCount={user._count.followers}
              />
            )}
          </div>

          {user.bio && <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">{user.bio}</p>}

          <div className="flex items-center gap-5 text-sm">
            <span>
              <span className="font-semibold text-zinc-200">{user._count.sets}</span>{" "}
              <span className="text-zinc-500">set</span>
            </span>
            <span>
              <span className="font-semibold text-zinc-200">{user._count.followers.toLocaleString()}</span>{" "}
              <span className="text-zinc-500">takipçi</span>
            </span>
            <span>
              <span className="font-semibold text-zinc-200">{user._count.following.toLocaleString()}</span>{" "}
              <span className="text-zinc-500">takip</span>
            </span>
          </div>
        </div>
      </div>

      {/* Sets grid */}
      {sets.length === 0 ? (
        <p className="text-sm text-zinc-600 py-10 text-center">Henüz yayınlanmış bir set yok.</p>
      ) : (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-zinc-300">Setler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sets.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
