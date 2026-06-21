import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Clock, Music2 } from "lucide-react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDuration } from "@/lib/utils";
import { PlayButton } from "@/components/set/PlayButton";
import { LikeButton } from "@/components/set/LikeButton";
import { EmojiReactions } from "@/components/set/EmojiReactions";
import { FollowButton } from "@/components/profile/FollowButton";
import { Comments } from "@/components/set/Comments";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const set = await db.set.findUnique({
    where: { id: params.id },
    select: { title: true, description: true, coverUrl: true, user: { select: { displayName: true, username: true } } },
  });

  if (!set) return { title: "Set not found — Journey" };

  const artist = set.user.displayName ?? set.user.username;
  const title = `${set.title} by ${artist}`;
  const description = set.description.slice(0, 160);
  const image = set.coverUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/og-default.png`;

  return {
    title: `${title} — Journey`,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type: "music.song",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

const MOOD_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  HYPNOTIC:    { label: "Hypnotic",    emoji: "🌀", color: "text-violet-400 bg-violet-500/10 border-violet-500/30" },
  EUPHORIC:    { label: "Euphoric",    emoji: "✨", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  TRIBAL:      { label: "Tribal",      emoji: "🌍", color: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
  FLOATING:    { label: "Floating",    emoji: "🌊", color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  DARK:        { label: "Dark",        emoji: "🌑", color: "text-zinc-400 bg-zinc-800 border-zinc-700" },
  MELANCHOLIC: { label: "Melancholic", emoji: "🌙", color: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
  RAW:         { label: "Raw",         emoji: "⚡", color: "text-red-400 bg-red-500/10 border-red-500/30" },
  COSMIC:      { label: "Cosmic",      emoji: "🚀", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
};

export default async function SetDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();

  const set = await db.set.findUnique({
    where: { id: params.id },
    include: {
      user: {
        include: {
          _count: { select: { followers: true, following: true } },
        },
      },
      _count: { select: { likes: true } },
    },
  });

  if (!set || set.status !== "READY") notFound();

  const [likeRecord, followRecord, reactionRows, userReactions] = await Promise.all([
    userId ? db.like.findUnique({ where: { userId_setId: { userId, setId: set.id } } }) : null,
    userId
      ? db.follow.findUnique({ where: { followerId_followingId: { followerId: userId, followingId: set.userId } } })
      : null,
    db.reaction.groupBy({ by: ["emoji"], where: { setId: set.id }, _count: { emoji: true } }),
    userId ? db.reaction.findMany({ where: { setId: set.id, userId }, select: { emoji: true } }) : [],
  ]);

  const userEmojiSet = new Set(userReactions.map((r) => r.emoji));
  const ALLOWED = ["🔥", "❤️", "🌀", "✨", "🌍", "🌊"];
  const reactions = ALLOWED.map((emoji) => {
    const found = reactionRows.find((r) => r.emoji === emoji);
    return { emoji, count: found?._count.emoji ?? 0, isReacted: userEmojiSet.has(emoji) };
  });

  const mood = set.mood ? MOOD_LABELS[set.mood] : null;
  const artistName = set.user.displayName ?? set.user.username;
  const isOwnProfile = userId === set.userId;

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      {/* Hero */}
      <div className="flex gap-6 items-start">
        <div className="relative shrink-0 w-48 h-48 rounded-2xl overflow-hidden bg-zinc-800 shadow-2xl shadow-black/50">
          {set.coverUrl ? (
            <Image src={set.coverUrl} alt={`${set.title} cover`} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
              <Music2 className="w-12 h-12 text-zinc-600" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 pt-1 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              {set.genre}
            </span>
            {mood && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${mood.color}`}>
                {mood.emoji} {mood.label}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="w-3 h-3" />
              {formatDuration(set.duration)}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-zinc-100 leading-tight">{set.title}</h1>

          <Link
            href={`/profile/${set.user.username}`}
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {set.user.avatarUrl ? (
              <Image
                src={set.user.avatarUrl}
                alt={artistName}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <span className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300">
                {artistName[0]?.toUpperCase()}
              </span>
            )}
            {artistName}
          </Link>

          <div className="flex items-center gap-3 pt-1">
            <PlayButton
              track={{
                id: set.id,
                title: set.title,
                artist: artistName,
                coverUrl: set.coverUrl,
                audioUrl: set.audioUrl,
              }}
            />
            <LikeButton
              setId={set.id}
              initialLiked={!!likeRecord}
              initialCount={set._count.likes}
              showCount
            />
            {!isOwnProfile && (
              <FollowButton
                username={set.user.username}
                initialFollowing={!!followRecord}
                initialCount={set.user._count.followers}
              />
            )}
          </div>
        </div>
      </div>

      {/* Emoji Reactions */}
      <div className="space-y-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Tepkiler</p>
        <EmojiReactions setId={set.id} initialReactions={reactions} />
      </div>

      {/* Description */}
      {set.description && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Açıklama</p>
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{set.description}</p>
        </div>
      )}

      {/* Comments */}
      <Comments setId={set.id} />
    </div>
  );
}
