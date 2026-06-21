"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Trash2, Send, Loader2, MessageCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  user: { username: string; displayName: string | null; avatarUrl: string | null };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "şimdi";
  if (m < 60) return `${m} dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} gün`;
  return new Date(dateStr).toLocaleDateString("tr-TR");
}

export function Comments({ setId }: { setId: string }) {
  const { user, isLoaded } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/sets/${setId}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []));
  }, [setId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/sets/${setId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) return;
      const { comment } = await res.json();
      setComments((prev) => [...prev, comment]);
      setBody("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/sets/${setId}/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) setComments((prev) => prev.filter((c) => c.id !== commentId));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-zinc-500" />
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
          Yorumlar {comments.length > 0 && `(${comments.length})`}
        </p>
      </div>

      {/* Comment list */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-sm text-zinc-600 py-4 text-center">İlk yorumu sen yap.</p>
        ) : (
          comments.map((c) => {
            const name = c.user.displayName ?? c.user.username;
            const isOwn = user?.id === c.userId;
            return (
              <div key={c.id} className="flex gap-3 group">
                <div className="shrink-0 w-7 h-7 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center">
                  {c.user.avatarUrl ? (
                    <Image src={c.user.avatarUrl} alt={name} width={28} height={28} className="object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-zinc-300">{name[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-zinc-300">{name}</span>
                    <span className="text-xs text-zinc-600">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed break-words">{c.body}</p>
                </div>
                {isOwn && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 p-1 rounded"
                    aria-label="Yorumu sil"
                  >
                    {deletingId === c.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Comment form */}
      {isLoaded && (
        user ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              placeholder="Yorum yaz…"
              className="flex-1 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!body.trim() || sending}
              className="px-3 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-1.5"
            >
              {sending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </form>
        ) : (
          <p className="text-sm text-zinc-600 text-center py-2">
            Yorum yapmak için{" "}
            <a href="/login" className="text-violet-400 hover:text-violet-300 underline">giriş yap</a>.
          </p>
        )
      )}
    </div>
  );
}
