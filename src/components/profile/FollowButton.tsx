"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface FollowButtonProps {
  username: string;
  initialFollowing: boolean;
  initialCount: number;
}

export function FollowButton({ username, initialFollowing, initialCount }: FollowButtonProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (!isSignedIn) { router.push("/login"); return; }

    setLoading(true);
    const newFollowing = !following;
    setFollowing(newFollowing);
    setCount((c) => (newFollowing ? c + 1 : c - 1));

    try {
      await fetch(`/api/users/${username}/follow`, { method: "POST" });
    } catch {
      setFollowing(!newFollowing);
      setCount((c) => (newFollowing ? c - 1 : c + 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-60 ${
        following
          ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600"
          : "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/30"
      }`}
    >
      {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
      {following ? "Takip Ediliyor" : "Takip Et"}
      <span className="text-xs opacity-60 tabular-nums">({count.toLocaleString()})</span>
    </button>
  );
}
