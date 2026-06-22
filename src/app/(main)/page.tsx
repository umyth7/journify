"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SetCard } from "@/components/set/SetCard";
import { MoodFilter, type MoodId } from "@/components/set/MoodFilter";
import { BetaSignupForm } from "@/components/ui/BetaSignupForm";
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


type SortMode = "new" | "trending";

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const [activeMood, setActiveMood] = useState<MoodId>(null);
  const [sort, setSort] = useState<SortMode>("new");
  const [sets, setSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const theme = activeMood ? MOOD_THEMES[activeMood] : MOOD_THEMES.default;

  const fetchSets = useCallback(async (mood: MoodId, sortMode: SortMode) => {
    setLoading(true);
    setNextCursor(null);
    try {
      const params = new URLSearchParams({ sort: sortMode, limit: "20" });
      if (mood) params.set("mood", mood);
      const res = await fetch(`/api/sets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSets(data.sets ?? []);
        setNextCursor(data.nextCursor ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ sort, limit: "20", cursor: nextCursor });
      if (activeMood) params.set("mood", activeMood);
      const res = await fetch(`/api/sets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSets((prev) => [...prev, ...(data.sets ?? [])]);
        setNextCursor(data.nextCursor ?? null);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, sort, activeMood]);

  // IntersectionObserver — load more when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => {
    fetchSets(activeMood, sort);
  }, [activeMood, sort, fetchSets]);

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

      {/* ── Beta signup ───────────────────────────────────────────────────────── */}
      <section aria-label="Join the beta" className="max-w-xl mx-auto">
        <p className="text-xs text-zinc-600 uppercase tracking-widest font-medium text-center mb-3">
          Early access
        </p>
        <BetaSignupForm />
      </section>

      {/* ── Mood Filter ───────────────────────────────────────────────────────── */}
      <section aria-label="Browse by mood">
        <MoodFilter value={activeMood} onChange={setActiveMood} />
      </section>

      {/* ── Feed ─────────────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5 gap-4">
          {/* Sort tabs */}
          <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1">
            {(["new", "trending"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[36px] ${
                  sort === s
                    ? "text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                style={sort === s ? { backgroundColor: theme.accentBg || "rgba(109,40,217,0.15)", color: theme.labelColor } : {}}
              >
                {s === "new" ? "New Arrivals" : "Trending"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <p className="text-sm text-zinc-500">
              {loading ? "Loading…" : activeMood ? `${sets.length} set${sets.length !== 1 ? "s" : ""}` : ""}
            </p>
            {activeMood && (
              <button
                onClick={() => setActiveMood(null)}
                className="text-xs px-3 py-1.5 rounded-lg min-h-[36px] border transition-opacity duration-150 hover:opacity-80 active:opacity-60"
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
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : sets.length === 0 ? (
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
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-in">
              {sets.map((set) => (
                <SetCard key={set.id} set={set} />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {loadingMore && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-zinc-800/50 animate-pulse" />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
