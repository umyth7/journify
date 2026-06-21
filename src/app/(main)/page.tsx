"use client";

import { useState } from "react";
import { SetCard } from "@/components/set/SetCard";
import { MoodFilter, type MoodId } from "@/components/set/MoodFilter";
import type { Set } from "@/types";

const MOCK_SETS: Set[] = [
  {
    id: "1",
    title: "Subterranean Movement Vol. 7",
    description: "Deep into the underground",
    genre: "Techno",
    mood: "HYPNOTIC",
    duration: 6300,
    audioUrl: "",
    coverUrl: null,
    status: "READY",
    createdAt: new Date("2024-06-01"),
    userId: "u1",
    user: { id: "u1", username: "rekoil", displayName: "Rekoil", avatarUrl: null, bio: null },
    likesCount: 284,
    isLiked: false,
  },
  {
    id: "2",
    title: "Fabric Live — Berlin Closing",
    description: "4h closing set from Tresor",
    genre: "Minimal Techno",
    mood: "DARK",
    duration: 14400,
    audioUrl: "",
    coverUrl: null,
    status: "READY",
    createdAt: new Date("2024-05-28"),
    userId: "u2",
    user: { id: "u2", username: "djshadow", displayName: "DJ Shadow", avatarUrl: null, bio: null },
    likesCount: 512,
    isLiked: false,
  },
  {
    id: "3",
    title: "Morning Rave — Sundown Series",
    description: "Sunrise vibes, deep house afro",
    genre: "Afro House",
    mood: "TRIBAL",
    duration: 8100,
    audioUrl: "",
    coverUrl: null,
    status: "READY",
    createdAt: new Date("2024-05-20"),
    userId: "u3",
    user: { id: "u3", username: "solarflare", displayName: "Solar Flare", avatarUrl: null, bio: null },
    likesCount: 189,
    isLiked: false,
  },
  {
    id: "4",
    title: "Late Night Sessions 003",
    description: "Dark ambient, industrial rhythms",
    genre: "Industrial",
    mood: "DARK",
    duration: 5400,
    audioUrl: "",
    coverUrl: null,
    status: "READY",
    createdAt: new Date("2024-05-15"),
    userId: "u4",
    user: { id: "u4", username: "noxvoid", displayName: "Nox Void", avatarUrl: null, bio: null },
    likesCount: 97,
    isLiked: false,
  },
  {
    id: "5",
    title: "Dub Techno Dimensions",
    description: "Echoes from the warehouse",
    genre: "Dub Techno",
    mood: "FLOATING",
    duration: 7200,
    audioUrl: "",
    coverUrl: null,
    status: "READY",
    createdAt: new Date("2024-05-10"),
    userId: "u5",
    user: { id: "u5", username: "echomatrix", displayName: "Echo Matrix", avatarUrl: null, bio: null },
    likesCount: 341,
    isLiked: false,
  },
  {
    id: "6",
    title: "Acid Rain — Live at Rex Club",
    description: "303 madness, acid house classics",
    genre: "Acid House",
    mood: "RAW",
    duration: 4800,
    audioUrl: "",
    coverUrl: null,
    status: "READY",
    createdAt: new Date("2024-05-05"),
    userId: "u6",
    user: { id: "u6", username: "acid303", displayName: "Acid 303", avatarUrl: null, bio: null },
    likesCount: 456,
    isLiked: false,
  },
  {
    id: "7",
    title: "Golden Hour — Rooftop Sessions",
    description: "Balearic beats at sunset",
    genre: "Balearic",
    mood: "EUPHORIC",
    duration: 9000,
    audioUrl: "",
    coverUrl: null,
    status: "READY",
    createdAt: new Date("2024-04-28"),
    userId: "u7",
    user: { id: "u7", username: "balearicbliss", displayName: "Balearic Bliss", avatarUrl: null, bio: null },
    likesCount: 223,
    isLiked: false,
  },
  {
    id: "8",
    title: "Hypnotic Patterns — Marathon",
    description: "6h hypnotic techno journey",
    genre: "Hypnotic Techno",
    mood: "HYPNOTIC",
    duration: 21600,
    audioUrl: "",
    coverUrl: null,
    status: "READY",
    createdAt: new Date("2024-04-20"),
    userId: "u8",
    user: { id: "u8", username: "voidwalker", displayName: "Void Walker", avatarUrl: null, bio: null },
    likesCount: 678,
    isLiked: false,
  },
  {
    id: "9",
    title: "Somewhere Between",
    description: "Ambient, kosmische musik",
    genre: "Ambient",
    mood: "FLOATING",
    duration: 10800,
    audioUrl: "",
    coverUrl: null,
    status: "READY",
    createdAt: new Date("2024-04-15"),
    userId: "u9",
    user: { id: "u9", username: "cosmika", displayName: "Cosmika", avatarUrl: null, bio: null },
    likesCount: 132,
    isLiked: false,
  },
  {
    id: "10",
    title: "Raw Cuts — Warehouse Night",
    description: "No frills hard techno",
    genre: "Hard Techno",
    mood: "RAW",
    duration: 7500,
    audioUrl: "",
    coverUrl: null,
    status: "READY",
    createdAt: new Date("2024-04-10"),
    userId: "u10",
    user: { id: "u10", username: "rawcutter", displayName: "Raw Cutter", avatarUrl: null, bio: null },
    likesCount: 389,
    isLiked: false,
  },
];

const MOOD_LABELS: Record<string, string> = {
  HYPNOTIC: "Hypnotic",
  EUPHORIC: "Euphoric",
  TRIBAL: "Tribal",
  FLOATING: "Floating",
  DARK: "Dark",
  MELANCHOLIC: "Melancholic",
  RAW: "Raw",
  COSMIC: "Cosmic",
};

export default function FeedPage() {
  const [activeMood, setActiveMood] = useState<MoodId>(null);

  const filteredSets = activeMood
    ? MOCK_SETS.filter((s) => s.mood === activeMood)
    : MOCK_SETS;

  return (
    <div className="py-6 space-y-10">

      {/* ── Hero ── */}
      <section className="relative text-center pt-8 pb-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        >
          <div className="w-[700px] h-[220px] bg-violet-900/12 blur-[90px] rounded-full" />
        </div>

        <div className="relative">
          <p className="text-[11px] font-medium text-violet-400 uppercase tracking-[0.25em] mb-4">
            Music is a Journey
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold font-syne text-zinc-100 leading-tight tracking-tight text-balance">
            How do you feel
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-violet-300">
              right now?
            </span>
          </h1>
          <p className="text-sm text-zinc-500 mt-4 max-w-xs mx-auto leading-relaxed">
            Pick a mood — find live sets that match your emotional state.
          </p>
        </div>
      </section>

      {/* ── Mood Filter ── */}
      <section aria-label="Browse by mood">
        <MoodFilter value={activeMood} onChange={setActiveMood} />
      </section>

      {/* ── Feed ── */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold font-syne text-zinc-100 tracking-tight">
              {activeMood ? `${MOOD_LABELS[activeMood]} Sets` : "New Arrivals"}
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {activeMood
                ? `Filtered by mood · ${filteredSets.length} set${filteredSets.length !== 1 ? "s" : ""}`
                : "Fresh sets from the community"}
            </p>
          </div>
          {activeMood && (
            <button
              onClick={() => setActiveMood(null)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150 px-3 py-1.5 rounded-lg hover:bg-zinc-800 min-h-[36px]"
            >
              Clear filter
            </button>
          )}
        </div>

        {filteredSets.length === 0 ? (
          <div className="text-center py-20 space-y-2">
            <p className="text-zinc-500 text-sm">No sets found for this mood yet.</p>
            <button
              onClick={() => setActiveMood(null)}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Show all sets
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-in">
            {filteredSets.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
