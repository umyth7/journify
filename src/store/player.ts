import { create } from "zustand";

export interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  audioUrl: string;
}

interface PlayerState {
  track: TrackInfo | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: (track: TrackInfo) => void;
  pause: () => void;
  resume: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
}

function trackPlay(setId: string) {
  fetch(`/api/sets/${setId}/play`, { method: "POST" }).catch(() => {
    // fire-and-forget — ignore errors
  });
}

export const usePlayerStore = create<PlayerState>((set) => ({
  track: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  play: (track) => {
    trackPlay(track.id);
    set({ track, isPlaying: true, currentTime: 0 });
  },
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
}));
