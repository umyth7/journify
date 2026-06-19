"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  setId: string;
  initialLiked: boolean;
  initialCount: number;
  showCount?: boolean;
}

export function LikeButton({
  setId,
  initialLiked,
  initialCount,
  showCount = true,
}: LikeButtonProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [burst, setBurst] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSignedIn) { router.push("/login"); return; }

    const newLiked = !liked;
    setLiked(newLiked);
    setCount((c) => (newLiked ? c + 1 : c - 1));
    if (newLiked) { setBurst(true); setTimeout(() => setBurst(false), 400); }

    try {
      await fetch(`/api/sets/${setId}/like`, { method: "POST" });
    } catch {
      setLiked(!newLiked);
      setCount((c) => (newLiked ? c - 1 : c + 1));
    }
  };

  return (
    <button
      onClick={handleLike}
      aria-label={liked ? "Unlike" : "Like"}
      className={`shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors duration-150 ${
        liked
          ? "text-red-400 hover:text-red-300"
          : "text-zinc-500 hover:text-red-400"
      }`}
    >
      <Heart
        className={`w-4 h-4 transition-transform duration-200 ${burst ? "scale-150" : "scale-100"}`}
        fill={liked ? "currentColor" : "none"}
        aria-hidden="true"
      />
      {showCount && (
        <span className="text-xs tabular-nums">{count.toLocaleString()}</span>
      )}
    </button>
  );
}
