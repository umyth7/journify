"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Loader2, Music } from "lucide-react";
import { SetCard } from "@/components/set/SetCard";
import type { Set } from "@/types";

const MOODS = [
  { value: "HYPNOTIC", label: "🌀 Hypnotic", color: "border-violet-500 text-violet-300 bg-violet-500/10" },
  { value: "EUPHORIC", label: "✨ Euphoric", color: "border-amber-500 text-amber-300 bg-amber-500/10" },
  { value: "TRIBAL", label: "🌍 Tribal", color: "border-amber-700 text-amber-400 bg-amber-700/10" },
  { value: "FLOATING", label: "🌊 Floating", color: "border-sky-500 text-sky-300 bg-sky-500/10" },
  { value: "DARK", label: "🌑 Dark", color: "border-zinc-600 text-zinc-400 bg-zinc-600/10" },
  { value: "MELANCHOLIC", label: "🌙 Melancholic", color: "border-slate-500 text-slate-300 bg-slate-500/10" },
  { value: "RAW", label: "⚡ Raw", color: "border-red-500 text-red-300 bg-red-500/10" },
  { value: "COSMIC", label: "🚀 Cosmic", color: "border-purple-500 text-purple-300 bg-purple-500/10" },
] as const;

interface Artist {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") ?? "";
  const initialMood = searchParams.get("mood") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [activeMood, setActiveMood] = useState(initialMood);
  const [sets, setSets] = useState<Set[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string, mood: string) => {
    if (q.trim().length < 2 && !mood) {
      setSets([]);
      setArtists([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim().length >= 2) params.set("q", q.trim());
      if (mood) params.set("mood", mood);
      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSets(data.sets ?? []);
        setArtists(data.artists ?? []);
        setSearched(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQ || initialMood) doSearch(initialQ, initialMood);
    inputRef.current?.focus();
  }, [initialQ, initialMood, doSearch]);

  const buildUrl = (q: string, mood: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (mood) params.set("mood", mood);
    const qs = params.toString();
    return qs ? `/search?${qs}` : "/search";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.replace(buildUrl(val, activeMood));
      doSearch(val, activeMood);
    }, 350);
  };

  const handleMoodToggle = (mood: string) => {
    const next = activeMood === mood ? "" : mood;
    setActiveMood(next);
    router.replace(buildUrl(query, next));
    doSearch(query, next);
  };

  const totalResults = sets.length + artists.length;

  return (
    <div className="py-6 space-y-8">
      {/* Search input */}
      <div className="space-y-3 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleChange}
            placeholder="Search sets, artists, genres…"
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl pl-12 pr-4 py-3.5 text-zinc-100 placeholder:text-zinc-500 text-base outline-none transition-all duration-150"
            aria-label="Search"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 animate-spin" />
          )}
        </div>

        {/* Mood chips */}
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => handleMoodToggle(m.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-150 ${
                activeMood === m.value
                  ? m.color
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-400"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Artists */}
      {artists.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Artists</h2>
          <div className="flex flex-wrap gap-3">
            {artists.map((a) => (
              <Link
                key={a.id}
                href={`/profile/${a.username}`}
                className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl px-4 py-3 transition-colors duration-150"
              >
                <div className="w-9 h-9 rounded-full bg-zinc-700 overflow-hidden shrink-0">
                  {a.avatarUrl ? (
                    <Image src={a.avatarUrl} alt={a.displayName ?? a.username} width={36} height={36} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm font-bold">
                      {(a.displayName ?? a.username)[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">{a.displayName ?? a.username}</p>
                  <p className="text-xs text-zinc-500">@{a.username}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sets */}
      {sets.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Sets <span className="text-zinc-600 normal-case font-normal">({sets.length})</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sets.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </div>
        </section>
      )}

      {/* Empty / idle states */}
      {searched && totalResults === 0 && !loading && (
        <div className="text-center py-20 space-y-2">
          <Music className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-zinc-400 font-medium">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-zinc-600 text-sm">Try a different keyword or browse by mood on the home page.</p>
        </div>
      )}

      {!searched && !loading && query.length < 2 && !activeMood && (
        <div className="text-center py-20 space-y-2">
          <Search className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-zinc-500 text-sm">Type at least 2 characters or pick a mood to search</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="py-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
          <div className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-12 pr-4 py-3.5 h-[52px]" />
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
