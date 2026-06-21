"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pause, Play, Volume2, AlertCircle } from "lucide-react";
import { usePlayerStore } from "@/store/player";
import { formatDuration } from "@/lib/utils";

export function AudioPlayer() {
  const { track, isPlaying, currentTime, duration, pause, resume, setCurrentTime, setDuration } =
    usePlayerStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioError, setAudioError] = useState(false);

  // Load new track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    setAudioError(false);
    audio.src = track.audioUrl;
    audio.currentTime = 0;
    if (isPlaying) audio.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  // Sync play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
    audio.currentTime = pct * duration;
    setCurrentTime(audio.currentTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!track) return null;

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => { if (audioRef.current) { setDuration(audioRef.current.duration); setAudioError(false); } }}
        onEnded={pause}
        onError={() => { setAudioError(true); pause(); }}
        preload="metadata"
      />
      <div
        className="fixed bottom-0 inset-x-0 z-50 h-[72px] border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md"
        role="region"
        aria-label="Audio player"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-full flex items-center gap-4">
          {/* Cover */}
          <div className="relative w-10 h-10 shrink-0 rounded-md overflow-hidden bg-zinc-800">
            {track.coverUrl && (
              <Image
                src={track.coverUrl}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
                aria-hidden="true"
              />
            )}
          </div>

          {/* Track info */}
          <div className="w-36 shrink-0 hidden sm:block min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">{track.title}</p>
            <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
          </div>

          {/* Audio error */}
          {audioError && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 flex-1 justify-center">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Ses dosyası yüklenemedi — R2 yapılandırmasını kontrol et
            </div>
          )}

          {/* Controls */}
          {!audioError && (
            <div className="flex flex-col items-center gap-1.5 flex-1 max-w-lg mx-auto">
              {/* Play/Pause */}
              <button
                onClick={isPlaying ? pause : resume}
                className="w-9 h-9 rounded-full bg-violet-500 hover:bg-violet-600 active:bg-violet-700 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" fill="white" aria-hidden="true" />
                ) : (
                  <Play className="w-4 h-4 text-white ml-0.5" fill="white" aria-hidden="true" />
                )}
              </button>

              {/* Progress bar */}
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs text-zinc-500 tabular-nums w-10 text-right shrink-0">
                  {formatDuration(currentTime)}
                </span>
                <div
                  className="flex-1 h-1 bg-zinc-700 rounded-full cursor-pointer group relative"
                  role="slider"
                  aria-label="Playback position"
                  aria-valuemin={0}
                  aria-valuemax={Math.floor(duration)}
                  aria-valuenow={Math.floor(currentTime)}
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-violet-500 rounded-full group-hover:bg-violet-400 transition-colors"
                    style={{ width: `${progress}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `calc(${progress}% - 6px)` }}
                  />
                </div>
                <span className="text-xs text-zinc-500 tabular-nums w-10 shrink-0">
                  {formatDuration(duration)}
                </span>
              </div>
            </div>
          )}

          {/* Volume — desktop only */}
          <div className="hidden lg:flex items-center gap-2 w-28 shrink-0" aria-label="Volume">
            <Volume2 className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden="true" />
            <div className="flex-1 h-1 bg-zinc-700 rounded-full">
              <div className="h-full w-2/3 bg-zinc-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
