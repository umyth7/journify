"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pause, Play, Volume1, Volume2, VolumeX, AlertCircle } from "lucide-react";
import { usePlayerStore } from "@/store/player";
import { formatDuration } from "@/lib/utils";

export function AudioPlayer() {
  const { track, isPlaying, currentTime, duration, pause, resume, setCurrentTime, setDuration } =
    usePlayerStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const seekDragging = useRef(false);
  const volDragging = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    setAudioError(false);
    audio.src = track.audioUrl;
    audio.currentTime = 0;
    if (isPlaying) audio.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying]);

  const getPct = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
  };

  // Seek handlers
  const applySeek = (pct: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = pct * duration;
    setCurrentTime(audio.currentTime);
  };

  const onSeekDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    seekDragging.current = true;
    applySeek(getPct(e));
  };
  const onSeekMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!seekDragging.current) return;
    applySeek(getPct(e));
  };
  const onSeekUp = () => { seekDragging.current = false; };

  // Volume handlers
  const applyVolume = (pct: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = pct;
    audio.muted = false;
    setVolume(pct);
    setMuted(false);
  };

  const onVolDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    volDragging.current = true;
    applyVolume(getPct(e));
  };
  const onVolMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!volDragging.current) return;
    applyVolume(getPct(e));
  };
  const onVolUp = () => { volDragging.current = false; };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    audio.muted = next;
    setMuted(next);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const effectiveVolume = muted ? 0 : volume;

  const VolumeIcon = effectiveVolume === 0
    ? VolumeX
    : effectiveVolume < 0.5
    ? Volume1
    : Volume2;

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

              {/* Progress bar — draggable */}
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs text-zinc-500 tabular-nums w-10 text-right shrink-0">
                  {formatDuration(currentTime)}
                </span>
                <div
                  className="flex-1 h-1 bg-zinc-700 rounded-full cursor-pointer group relative touch-none"
                  role="slider"
                  aria-label="Playback position"
                  aria-valuemin={0}
                  aria-valuemax={Math.floor(duration)}
                  aria-valuenow={Math.floor(currentTime)}
                  onPointerDown={onSeekDown}
                  onPointerMove={onSeekMove}
                  onPointerUp={onSeekUp}
                >
                  <div
                    className="h-full bg-violet-500 rounded-full group-hover:bg-violet-400 transition-colors pointer-events-none"
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

          {/* Volume — desktop only, draggable */}
          <div className="hidden lg:flex items-center gap-2 w-32 shrink-0" aria-label="Volume">
            <button
              onClick={toggleMute}
              className="text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
              aria-label={muted ? "Sesi aç" : "Sesi kapat"}
            >
              <VolumeIcon className="w-4 h-4" aria-hidden="true" />
            </button>
            <div
              className="flex-1 h-1 bg-zinc-700 rounded-full cursor-pointer group relative touch-none"
              role="slider"
              aria-label="Ses seviyesi"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(effectiveVolume * 100)}
              onPointerDown={onVolDown}
              onPointerMove={onVolMove}
              onPointerUp={onVolUp}
            >
              <div
                className="h-full bg-zinc-400 group-hover:bg-violet-400 rounded-full transition-colors pointer-events-none"
                style={{ width: `${effectiveVolume * 100}%` }}
              />
            </div>
            <span className="text-xs text-zinc-500 tabular-nums w-7 shrink-0">
              {Math.round(effectiveVolume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
