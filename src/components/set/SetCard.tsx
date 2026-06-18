"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Heart, Clock } from "lucide-react";
import { usePlayerStore } from "@/store/player";
import { formatDuration } from "@/lib/utils";
import type { Set } from "@/types";

interface SetCardProps {
  set: Set;
}

export function SetCard({ set }: SetCardProps) {
  const { track, isPlaying, play, pause, resume } = usePlayerStore();
  const isThisTrack = track?.id === set.id;
  const isThisPlaying = isThisTrack && isPlaying;

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isThisTrack) {
      if (isPlaying) pause();
      else resume();
    } else {
      play({
        id: set.id,
        title: set.title,
        artist: set.user.displayName ?? set.user.username,
        coverUrl: set.coverUrl,
        audioUrl: set.audioUrl,
      });
    }
  };

  return (
    <article className="group bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all duration-200 hover:shadow-lg hover:shadow-black/40 animate-fade-in">
      {/* Cover art */}
      <Link href={`/sets/${set.id}`} className="block relative aspect-square bg-zinc-800 overflow-hidden">
        {set.coverUrl ? (
          <Image
            src={set.coverUrl}
            alt={`${set.title} cover art`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border border-zinc-600 flex items-center justify-center opacity-40">
              <Play className="w-4 h-4 text-zinc-400 ml-0.5" aria-hidden="true" />
            </div>
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <button
            onClick={handlePlayToggle}
            className="w-12 h-12 rounded-full bg-violet-500 hover:bg-violet-600 active:bg-violet-700 flex items-center justify-center shadow-lg shadow-violet-900/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
            aria-label={isThisPlaying ? `Pause ${set.title}` : `Play ${set.title}`}
          >
            {isThisPlaying ? (
              <svg className="w-5 h-5 text-white" fill="white" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" fill="white" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 text-zinc-200 text-xs px-1.5 py-0.5 rounded-md tabular-nums backdrop-blur-sm">
          <Clock className="w-3 h-3" aria-hidden="true" />
          {formatDuration(set.duration)}
        </div>

        {/* Playing indicator */}
        {isThisPlaying && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-violet-500/90 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            Playing
          </div>
        )}
      </Link>

      {/* Card body */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/sets/${set.id}`}
              className="block text-sm font-medium text-zinc-100 hover:text-violet-400 transition-colors duration-150 leading-snug truncate"
            >
              {set.title}
            </Link>
            <Link
              href={`/profile/${set.user.username}`}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150 mt-0.5 block truncate"
            >
              {set.user.displayName ?? set.user.username}
            </Link>
          </div>
          <button
            aria-label={`Like ${set.title}`}
            className="shrink-0 p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md text-zinc-600 hover:text-red-400 transition-colors duration-150"
          >
            <Heart className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-400 border border-zinc-700/50">
            {set.genre}
          </span>
          <span className="text-xs text-zinc-600 tabular-nums">
            {set.likesCount.toLocaleString()} likes
          </span>
        </div>
      </div>
    </article>
  );
}
