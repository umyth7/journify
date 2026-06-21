import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Settings, AtSign, Music, Globe } from "lucide-react";
import { db } from "@/lib/db";
import { SetCard } from "@/components/set/SetCard";
import { FollowButton } from "@/components/profile/FollowButton";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import type { Set } from "@/types";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: { username: string };
  searchParams: { tab?: string };
}) {
  const { userId } = await auth();
  const activeTab = searchParams.tab === "likes" ? "likes" : "sets";

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

  // Fetch liked sets when on likes tab
  const likedSetsRaw = activeTab === "likes"
    ? await db.like.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          set: {
            include: {
              user: { select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true } },
              _count: { select: { likes: true } },
            },
          },
        },
      })
    : [];

  const viewerLikedSetIds = userId
    ? new Set(
        (await db.like.findMany({
          where: {
            userId,
            setId: {
              in: activeTab === "sets"
                ? user.sets.map((s) => s.id)
                : likedSetsRaw.map((l) => l.set.id),
            },
          },
          select: { setId: true },
        })).map((l) => l.setId)
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
    isLiked: viewerLikedSetIds.has(s.id),
  }));

  const likedSets: Set[] = likedSetsRaw.map((l) => ({
    id: l.set.id,
    title: l.set.title,
    description: l.set.description,
    genre: l.set.genre,
    mood: l.set.mood as Set["mood"],
    duration: l.set.duration,
    audioUrl: l.set.audioUrl,
    coverUrl: l.set.coverUrl,
    status: l.set.status as Set["status"],
    createdAt: l.set.createdAt,
    userId: l.set.userId,
    user: l.set.user,
    likesCount: l.set._count.likes,
    isLiked: viewerLikedSetIds.has(l.set.id),
  }));

  return (
    <div className="py-10 space-y-10">
      {/* Profile header */}
      <div className="flex items-start gap-6">
        <div className="shrink-0">
          {isOwnProfile ? (
            <AvatarUpload
              currentUrl={user.avatarUrl}
              username={user.username}
            />
          ) : (
            <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 shadow-xl shadow-black/40">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={displayName} width={80} height={80} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-300 bg-gradient-to-br from-violet-700 to-zinc-800">
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-zinc-100">{displayName}</h1>
              <p className="text-sm text-zinc-500">@{user.username}</p>
            </div>
            {isOwnProfile ? (
              <Link
                href="/profile/edit"
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-600 transition-colors min-h-[36px]"
              >
                <Settings className="w-3.5 h-3.5" />
                Düzenle
              </Link>
            ) : (
              <FollowButton
                username={user.username}
                initialFollowing={!!followRecord}
                initialCount={user._count.followers}
              />
            )}
          </div>

          {user.bio && <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">{user.bio}</p>}

          {/* Social links */}
          {(user.instagram || user.soundcloud || user.website) && (
            <div className="flex flex-wrap items-center gap-3">
              {user.instagram && (
                <a
                  href={user.instagram.startsWith("http") ? user.instagram : `https://${user.instagram}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-violet-400 transition-colors"
                >
                  <AtSign className="w-3.5 h-3.5" />
                  {user.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@").replace(/\/$/, "")}
                </a>
              )}
              {user.soundcloud && (
                <a
                  href={user.soundcloud.startsWith("http") ? user.soundcloud : `https://${user.soundcloud}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-violet-400 transition-colors"
                >
                  <Music className="w-3.5 h-3.5" />
                  SoundCloud
                </a>
              )}
              {user.website && (
                <a
                  href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-violet-400 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {user.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </a>
              )}
            </div>
          )}

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

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-zinc-800">
        <Link
          href={`/profile/${user.username}`}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "sets"
              ? "border-violet-500 text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Setler
          <span className="ml-1.5 text-xs text-zinc-600">{user._count.sets}</span>
        </Link>
        <Link
          href={`/profile/${user.username}?tab=likes`}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "likes"
              ? "border-violet-500 text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Beğeniler
        </Link>
      </div>

      {/* Sets grid */}
      {activeTab === "sets" && (
        sets.length === 0 ? (
          <p className="text-sm text-zinc-600 py-10 text-center">Henüz yayınlanmış bir set yok.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sets.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </div>
        )
      )}

      {/* Liked sets grid */}
      {activeTab === "likes" && (
        likedSets.length === 0 ? (
          <p className="text-sm text-zinc-600 py-10 text-center">Henüz beğenilmiş bir set yok.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {likedSets.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
