"use client";

import type { ElementType } from "react";
import { Disc3, Sparkles, Globe2, Waves, Moon, CloudDrizzle, Zap, Rocket } from "lucide-react";

export type MoodId =
  | "HYPNOTIC"
  | "EUPHORIC"
  | "TRIBAL"
  | "FLOATING"
  | "DARK"
  | "MELANCHOLIC"
  | "RAW"
  | "COSMIC"
  | null;

interface MoodItem {
  id: Exclude<MoodId, null>;
  label: string;
  tagline: string;
  Icon: ElementType;
  idle: string;
  hover: string;
  active: string;
  iconIdle: string;
  iconActive: string;
  textIdle: string;
  textActive: string;
}

const MOODS: MoodItem[] = [
  {
    id: "HYPNOTIC",
    label: "Hypnotic",
    tagline: "Time suspends",
    Icon: Disc3,
    idle: "bg-violet-950/30 border-violet-800/25",
    hover: "hover:bg-violet-900/35 hover:border-violet-600/50",
    active: "bg-violet-900/50 border-violet-500 shadow-lg shadow-violet-950/60",
    iconIdle: "text-violet-500 bg-violet-900/50",
    iconActive: "text-violet-300 bg-violet-800/60",
    textIdle: "text-zinc-400",
    textActive: "text-violet-300",
  },
  {
    id: "EUPHORIC",
    label: "Euphoric",
    tagline: "Chest opens",
    Icon: Sparkles,
    idle: "bg-amber-950/20 border-amber-800/25",
    hover: "hover:bg-amber-900/30 hover:border-amber-600/50",
    active: "bg-amber-900/40 border-amber-500 shadow-lg shadow-amber-950/60",
    iconIdle: "text-amber-500 bg-amber-900/50",
    iconActive: "text-amber-300 bg-amber-800/60",
    textIdle: "text-zinc-400",
    textActive: "text-amber-300",
  },
  {
    id: "TRIBAL",
    label: "Tribal",
    tagline: "Cells respond",
    Icon: Globe2,
    idle: "bg-orange-950/20 border-orange-900/25",
    hover: "hover:bg-orange-900/30 hover:border-orange-700/50",
    active: "bg-orange-900/40 border-orange-600 shadow-lg shadow-orange-950/60",
    iconIdle: "text-orange-500 bg-orange-900/50",
    iconActive: "text-orange-300 bg-orange-800/60",
    textIdle: "text-zinc-400",
    textActive: "text-orange-300",
  },
  {
    id: "FLOATING",
    label: "Floating",
    tagline: "Gravity fades",
    Icon: Waves,
    idle: "bg-sky-950/20 border-sky-800/25",
    hover: "hover:bg-sky-900/30 hover:border-sky-600/50",
    active: "bg-sky-900/40 border-sky-500 shadow-lg shadow-sky-950/60",
    iconIdle: "text-sky-500 bg-sky-900/50",
    iconActive: "text-sky-300 bg-sky-800/60",
    textIdle: "text-zinc-400",
    textActive: "text-sky-300",
  },
  {
    id: "DARK",
    label: "Dark",
    tagline: "Underground",
    Icon: Moon,
    idle: "bg-zinc-900/50 border-zinc-700/30",
    hover: "hover:bg-zinc-800/60 hover:border-zinc-600/60",
    active: "bg-zinc-800/80 border-zinc-400 shadow-lg shadow-black/70",
    iconIdle: "text-zinc-400 bg-zinc-800/60",
    iconActive: "text-zinc-200 bg-zinc-700/60",
    textIdle: "text-zinc-400",
    textActive: "text-zinc-200",
  },
  {
    id: "MELANCHOLIC",
    label: "Melancholic",
    tagline: "Bittersweet",
    Icon: CloudDrizzle,
    idle: "bg-slate-900/30 border-slate-700/25",
    hover: "hover:bg-slate-800/40 hover:border-slate-500/50",
    active: "bg-slate-800/60 border-slate-400 shadow-lg shadow-slate-950/60",
    iconIdle: "text-slate-400 bg-slate-800/50",
    iconActive: "text-slate-200 bg-slate-700/60",
    textIdle: "text-zinc-400",
    textActive: "text-slate-300",
  },
  {
    id: "RAW",
    label: "Raw",
    tagline: "Pure energy",
    Icon: Zap,
    idle: "bg-red-950/20 border-red-900/25",
    hover: "hover:bg-red-900/30 hover:border-red-700/50",
    active: "bg-red-900/40 border-red-500 shadow-lg shadow-red-950/60",
    iconIdle: "text-red-500 bg-red-900/50",
    iconActive: "text-red-300 bg-red-800/60",
    textIdle: "text-zinc-400",
    textActive: "text-red-300",
  },
  {
    id: "COSMIC",
    label: "Cosmic",
    tagline: "Universe vast",
    Icon: Rocket,
    idle: "bg-purple-950/20 border-purple-800/25",
    hover: "hover:bg-purple-900/30 hover:border-purple-600/50",
    active: "bg-purple-900/40 border-purple-500 shadow-lg shadow-purple-950/60",
    iconIdle: "text-purple-400 bg-purple-900/50",
    iconActive: "text-purple-200 bg-purple-800/60",
    textIdle: "text-zinc-400",
    textActive: "text-purple-300",
  },
];

interface MoodFilterProps {
  value: MoodId;
  onChange: (mood: MoodId) => void;
}

export function MoodFilter({ value, onChange }: MoodFilterProps) {
  return (
    <div className="relative">
      {/* Mobile: horizontal scroll · Desktop: 4-col then 8-col grid */}
      <div
        role="radiogroup"
        aria-label="Filter sets by mood"
        className="
          flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory
          md:grid md:grid-cols-4 md:overflow-visible md:snap-none
          lg:grid-cols-8
        "
      >
        {MOODS.map(({ id, label, tagline, Icon, idle, hover, active, iconIdle, iconActive, textActive }) => {
          const isActive = value === id;
          return (
            <button
              key={id}
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(isActive ? null : id)}
              className={`
                group relative flex-shrink-0 w-[148px] md:w-auto snap-start
                flex flex-col items-center justify-center gap-2.5
                px-3 py-5 rounded-2xl border backdrop-blur-sm
                transition-all duration-300 cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
                ${isActive ? active : `${idle} ${hover}`}
                ${!isActive && value !== null ? "opacity-35 hover:opacity-70 scale-[0.97] hover:scale-[0.99]" : "opacity-100 scale-100"}
              `}
            >
              {/* Icon */}
              <div
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                  ${isActive ? iconActive : iconIdle}
                `}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>

              {/* Text */}
              <div className="text-center">
                <p
                  className={`
                    text-sm font-semibold font-syne tracking-wide leading-none transition-colors duration-200
                    ${isActive ? textActive : "text-zinc-300"}
                  `}
                >
                  {label}
                </p>
                <p
                  className={`
                    text-[11px] mt-1 leading-none transition-colors duration-200
                    ${isActive ? "text-zinc-400" : "text-zinc-600"}
                  `}
                >
                  {tagline}
                </p>
              </div>

              {/* Active dot indicator */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-current opacity-80"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile scroll fade hint */}
      <div
        aria-hidden="true"
        className="
          md:hidden pointer-events-none absolute right-0 top-0 bottom-1
          w-12 bg-gradient-to-l from-zinc-950 to-transparent
        "
      />
    </div>
  );
}
