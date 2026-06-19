"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { ReactionCount } from "@/types";

const PRESET_EMOJIS = [
  { emoji: "🔥", label: "fire" },
  { emoji: "❤️", label: "love" },
  { emoji: "🌀", label: "hypnotic" },
  { emoji: "✨", label: "euphoric" },
  { emoji: "🌍", label: "tribal" },
  { emoji: "🌊", label: "floating" },
];

interface EmojiReactionsProps {
  setId: string;
  initialReactions: ReactionCount[];
}

export function EmojiReactions({ setId, initialReactions }: EmojiReactionsProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const pickerRef = useRef<HTMLDivElement>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [reactions, setReactions] = useState<ReactionCount[]>(() =>
    PRESET_EMOJIS.map(({ emoji }) => {
      const found = initialReactions.find((r) => r.emoji === emoji);
      return found ?? { emoji, count: 0, isReacted: false };
    })
  );
  const [animating, setAnimating] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReact = async (emoji: string) => {
    if (!isSignedIn) { router.push("/login"); return; }

    setAnimating(emoji);
    setTimeout(() => setAnimating(null), 300);

    setReactions((prev) =>
      prev.map((r) => {
        if (r.emoji !== emoji) return r;
        const isNowReacted = !r.isReacted;
        return { ...r, isReacted: isNowReacted, count: isNowReacted ? r.count + 1 : r.count - 1 };
      })
    );
    setShowPicker(false);

    try {
      const res = await fetch(`/api/sets/${setId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();
      setReactions(
        PRESET_EMOJIS.map(({ emoji: e }) => {
          const found = data.reactions.find((r: ReactionCount) => r.emoji === e);
          return found ?? { emoji: e, count: 0, isReacted: false };
        })
      );
    } catch {
      setReactions((prev) =>
        prev.map((r) => {
          if (r.emoji !== emoji) return r;
          const wasReacted = r.isReacted;
          return { ...r, isReacted: !wasReacted, count: wasReacted ? r.count + 1 : r.count - 1 };
        })
      );
    }
  };

  const activeReactions = reactions.filter((r) => r.count > 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeReactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => handleReact(r.emoji)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border transition-all duration-150 ${
            r.isReacted
              ? "bg-violet-500/20 border-violet-500/50 text-violet-200 hover:bg-violet-500/30"
              : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
          } ${animating === r.emoji ? "scale-125" : "scale-100"}`}
        >
          <span>{r.emoji}</span>
          <span className="text-xs tabular-nums text-zinc-400">{r.count}</span>
        </button>
      ))}

      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-zinc-700 bg-zinc-800/50 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-all duration-150"
          aria-label="Add reaction"
        >
          <span className="text-base leading-none">+</span>
          <span>Tepki</span>
        </button>

        {showPicker && (
          <div className="absolute bottom-full mb-2 left-0 flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-2xl px-3 py-2 shadow-2xl shadow-black/60 z-20 animate-fade-in">
            {PRESET_EMOJIS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                aria-label={label}
                className="text-xl p-1.5 rounded-xl hover:bg-zinc-800 hover:scale-125 transition-all duration-100"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
