"use client";

import { Pause, Play } from "lucide-react";
import { usePlayerStore, TrackInfo } from "@/store/player";

interface PlayButtonProps {
  track: TrackInfo;
}

export function PlayButton({ track }: PlayButtonProps) {
  const { track: current, isPlaying, play, pause, resume } = usePlayerStore();

  const isThisTrack = current?.id === track.id;

  const handleClick = () => {
    if (!isThisTrack) {
      play(track);
    } else if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const playing = isThisTrack && isPlaying;

  return (
    <button
      onClick={handleClick}
      aria-label={playing ? "Pause" : "Play"}
      className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
    >
      {playing ? (
        <Pause className="w-4 h-4" fill="white" aria-hidden="true" />
      ) : (
        <Play className="w-4 h-4 ml-0.5" fill="white" aria-hidden="true" />
      )}
      {playing ? "Duraklat" : "Oynat"}
    </button>
  );
}
