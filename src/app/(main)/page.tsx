"use client";

import { useState } from "react";
import { SetCard } from "@/components/set/SetCard";
import { MoodFilter, type MoodId } from "@/components/set/MoodFilter";
import type { Set } from "@/types";

// ── Mood theme tokens ─────────────────────────────────────────────────────────
// glowColor  → backgroundColor of the blurred glow blob (solid, transitions smoothly)
// textColor  → hero "right now?" and h2 heading color
// labelColor → "MUSIC IS A JOURNEY" label + clear button
// accentBg   → clear-filter button background tint

type MoodTheme = {
  glowColor: string;
  textColor: string;
  labelColor: string;
  accentBg: string;
  bgTint: string;
};

const MOOD_THEMES: Record<Exclude<MoodId, null> | "default", MoodTheme> = {
  default:    { glowColor: "#6d28d9", textColor: "#a78bfa", labelColor: "#a78bfa", accentBg: "rgba(109,40,217,0.12)", bgTint: "rgba(109,40,217,0.00)" },
  HYPNOTIC:   { glowColor: "#7c3aed", textColor: "#c4b5fd", labelColor: "#a78bfa", accentBg: "rgba(124,58,237,0.15)", bgTint: "rgba(124,58,237,0.08)" },
  EUPHORIC:   { glowColor: "#f59e0b", textColor: "#fde68a", labelColor: "#fbbf24", accentBg: "rgba(245,158,11,0.12)", bgTint: "rgba(245,158,11,0.07)" },
  TRIBAL:     { glowColor: "#ea580c", textColor: "#fed7aa", labelColor: "#fb923c", accentBg: "rgba(234,88,12,0.12)",  bgTint: "rgba(234,88,12,0.07)"  },
  FLOATING:   { glowColor: "#0ea5e9", textColor: "#bae6fd", labelColor: "#38bdf8", accentBg: "rgba(14,165,233,0.12)", bgTint: "rgba(14,165,233,0.07)" },
  DARK:       { glowColor: "#27272a", textColor: "#d4d4d8", labelColor: "#a1a1aa", accentBg: "rgba(39,39,42,0.40)",  bgTint: "rgba(0,0,0,0.30)"      },
  MELANCHOLIC:{ glowColor: "#64748b", textColor: "#e2e8f0", labelColor: "#94a3b8", accentBg: "rgba(100,116,139,0.12)",bgTint: "rgba(100,116,139,0.07)"},
  RAW:        { glowColor: "#ef4444", textColor: "#fecaca", labelColor: "#f87171", accentBg: "rgba(239,68,68,0.12)", bgTint: "rgba(239,68,68,0.08)"   },
  COSMIC:     { glowColor: "#8b5cf6", textColor: "#ede9fe", labelColor: "#c4b5fd", accentBg: "rgba(139,92,246,0.12)", bgTint: "rgba(139,92,246,0.08)" },
};

const TRANSITION = "500ms cubic-bezier(0.4, 0, 0.2, 1)";

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_SETS: Set[] = [
  { id: "1",  title: "Subterranean Movement Vol. 7", description: "Deep into the underground",    genre: "Techno",         mood: "HYPNOTIC",   duration: 6300,  audioUrl: "", coverUrl: null, status: "READY", createdAt: new Date("2024-06-01"), userId: "u1",  user: { id: "u1",  username: "rekoil",       displayName: "Rekoil",        avatarUrl: null, bio: null }, likesCount: 284, isLiked: false },
  { id: "2",  title: "Fabric Live — Berlin Closing", description: "4h closing set from Tresor",   genre: "Minimal Techno", mood: "DARK",        duration: 14400, audioUrl: "", coverUrl: null, status: "READY", createdAt: new Date("2024-05-28"), userId: "u2",  user: { id: "u2",  username: "djshadow",     displayName: "DJ Shadow",     avatarUrl: null, bio: null }, likesCount: 512, isLiked: false },
  { id: "3",  title: "Morning Rave — Sundown Series",description: "Sunrise vibes, deep house afro",genre: "Afro House",    mood: "TRIBAL",     duration: 8100,  audioUrl: "", coverUrl: null, status: "READY", createdAt: new Date("2024-05-20"), userId: "u3",  user: { id: "u3",  username: "solarflare",   displayName: "Solar Flare",   avatarUrl: null, bio: null }, likesCount: 189, isLiked: false },
  { id: "4",  title: "Late Night Sessions 003",       description: "Dark ambient, industrial",     genre: "Industrial",     mood: "DARK",        duration: 5400,  audioUrl: "", coverUrl: null, status: "READY", createdAt: new Date("2024-05-15"), userId: "u4",  user: { id: "u4",  username: "noxvoid",      displayName: "Nox Void",      avatarUrl: null, bio: null }, likesCount: 97,  isLiked: false },
  { id: "5",  title: "Dub Techno Dimensions",         description: "Echoes from the warehouse",   genre: "Dub Techno",     mood: "FLOATING",   duration: 7200,  audioUrl: "", coverUrl: null, status: "READY", createdAt: new Date("2024-05-10"), userId: "u5",  user: { id: "u5",  username: "echomatrix",   displayName: "Echo Matrix",   avatarUrl: null, bio: null }, likesCount: 341, isLiked: false },
  { id: "6",  title: "Acid Rain — Live at Rex Club",  description: "303 madness, acid classics",  genre: "Acid House",     mood: "RAW",        duration: 4800,  audioUrl: "", coverUrl: null, status: "READY", createdAt: new Date("2024-05-05"), userId: "u6",  user: { id: "u6",  username: "acid303",      displayName: "Acid 303",      avatarUrl: null, bio: null }, likesCount: 456, isLiked: false },
  { id: "7",  title: "Golden Hour — Rooftop Sessions",description: "Balearic beats at sunset",    genre: "Balearic",       mood: "EUPHORIC",   duration: 9000,  audioUrl: "", coverUrl: null, status: "READY", createdAt: new Date("2024-04-28"), userId: "u7",  user: { id: "u7",  username: "balearicbliss",displayName: "Balearic Bliss",avatarUrl: null, bio: null }, likesCount: 223, isLiked: false },
  { id: "8",  title: "Hypnotic Patterns — Marathon",  description: "6h hypnotic techno journey",  genre: "Hypnotic Techno",mood: "HYPNOTIC",   duration: 21600, audioUrl: "", coverUrl: null, status: "READY", createdAt: new Date("2024-04-20"), userId: "u8",  user: { id: "u8",  username: "voidwalker",   displayName: "Void Walker",   avatarUrl: null, bio: null }, likesCount: 678, isLiked: false },
  { id: "9",  title: "Somewhere Between",             description: "Ambient, kosmische musik",    genre: "Ambient",        mood: "FLOATING",   duration: 10800, audioUrl: "", coverUrl: null, status: "READY", createdAt: new Date("2024-04-15"), userId: "u9",  user: { id: "u9",  username: "cosmika",      displayName: "Cosmika",       avatarUrl: null, bio: null }, likesCount: 132, isLiked: false },
  { id: "10", title: "Raw Cuts — Warehouse Night",    description: "No frills hard techno",       genre: "Hard Techno",    mood: "RAW",        duration: 7500,  audioUrl: "", coverUrl: null, status: "READY", createdAt: new Date("2024-04-10"), userId: "u10", user: { id: "u10", username: "rawcutter",    displayName: "Raw Cutter",    avatarUrl: null, bio: null }, likesCount: 389, isLiked: false },
];

const MOOD_LABELS: Record<string, string> = {
  HYPNOTIC: "Hypnotic", EUPHORIC: "Euphoric", TRIBAL: "Tribal",
  FLOATING: "Floating", DARK: "Dark", MELANCHOLIC: "Melancholic",
  RAW: "Raw", COSMIC: "Cosmic",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const [activeMood, setActiveMood] = useState<MoodId>(null);

  const theme = activeMood ? MOOD_THEMES[activeMood] : MOOD_THEMES.default;
  const filteredSets = activeMood
    ? MOCK_SETS.filter((s) => s.mood === activeMood)
    : MOCK_SETS;

  return (
    <div className="py-6 space-y-10">

      {/* ── Full-page mood tint ──────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          backgroundColor: theme.bgTint,
          transition: `background-color ${TRANSITION}`,
        }}
      />

      {/* ── Ambient mood glow ─────────────────────────────────────────────────
          Uses backgroundColor + blur so CSS can transition it smoothly.
          background-image (gradient) is not animatable by the browser.        */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 -z-10 flex justify-center overflow-hidden">
        <div
          className="w-[900px] h-[420px] rounded-full"
          style={{
            backgroundColor: theme.glowColor,
            opacity: activeMood ? 0.22 : 0.14,
            filter: "blur(110px)",
            transition: `background-color ${TRANSITION}, opacity ${TRANSITION}`,
          }}
        />
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative text-center pt-8 pb-4">
        <div className="relative">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.25em] mb-4 font-syne"
            style={{ color: theme.labelColor, transition: `color ${TRANSITION}` }}
          >
            Music is a Journey
          </p>

          <h1 className="text-4xl sm:text-5xl font-bold font-syne text-zinc-100 leading-tight tracking-tight text-balance">
            How do you feel
            <br />
            <span
              style={{ color: theme.textColor, transition: `color ${TRANSITION}` }}
            >
              right now?
            </span>
          </h1>

          <p className="text-sm text-zinc-500 mt-4 max-w-xs mx-auto leading-relaxed">
            Pick a mood — find live sets that match your emotional state.
          </p>
        </div>
      </section>

      {/* ── Mood Filter ───────────────────────────────────────────────────────── */}
      <section aria-label="Browse by mood">
        <MoodFilter value={activeMood} onChange={setActiveMood} />
      </section>

      {/* ── Feed ─────────────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <h2
              className="text-xl font-bold font-syne tracking-tight"
              style={{
                color: activeMood ? theme.textColor : "#e4e4e7",
                transition: `color ${TRANSITION}`,
              }}
            >
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
              className="text-xs px-3 py-1.5 rounded-lg min-h-[44px] border transition-opacity duration-150 hover:opacity-80 active:opacity-60"
              style={{
                color: theme.labelColor,
                borderColor: `${theme.glowColor}55`,
                backgroundColor: theme.accentBg,
              }}
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
              className="text-xs transition-colors duration-150 hover:opacity-80 min-h-[44px] px-4"
              style={{ color: theme.labelColor }}
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
