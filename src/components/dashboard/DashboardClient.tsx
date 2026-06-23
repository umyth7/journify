"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, Headphones, Heart, X, Check, AlertTriangle } from "lucide-react";
import type { Mood } from "@/types";

const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: "HYPNOTIC", label: "Hypnotic", emoji: "🌀" },
  { value: "EUPHORIC", label: "Euphoric", emoji: "✨" },
  { value: "TRIBAL", label: "Tribal", emoji: "🌍" },
  { value: "FLOATING", label: "Floating", emoji: "🌊" },
  { value: "DARK", label: "Dark", emoji: "🌑" },
  { value: "MELANCHOLIC", label: "Melancholic", emoji: "🌙" },
  { value: "RAW", label: "Raw", emoji: "⚡" },
  { value: "COSMIC", label: "Cosmic", emoji: "🚀" },
];

export interface DashboardSet {
  id: string;
  title: string;
  description: string;
  genre: string;
  mood: Mood | null;
  status: string;
  playsCount: number;
  likesCount: number;
  coverUrl: string | null;
  createdAt: string;
}

interface EditState {
  title: string;
  description: string;
  genre: string;
  mood: Mood | null;
}

export function DashboardClient({ initialSets }: { initialSets: DashboardSet[] }) {
  const [sets, setSets] = useState(initialSets);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openEdit(set: DashboardSet) {
    setEditingId(set.id);
    setEditState({ title: set.title, description: set.description, genre: set.genre, mood: set.mood });
  }

  function closeEdit() {
    setEditingId(null);
    setEditState(null);
  }

  async function saveEdit() {
    if (!editingId || !editState) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sets/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editState),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setSets((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, ...updated } : s))
      );
      closeEdit();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sets/${deletingId}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setSets((prev) => prev.filter((s) => s.id !== deletingId));
      }
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  }

  return (
    <>
      {/* Set list */}
      <div className="space-y-3">
        {sets.length === 0 && (
          <p className="text-zinc-500 text-sm text-center py-12">No sets uploaded yet.</p>
        )}
        {sets.map((set) => (
          <div
            key={set.id}
            className="flex items-center gap-4 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
          >
            {/* Cover */}
            <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
              {set.coverUrl ? (
                <Image src={set.coverUrl} alt={set.title} width={48} height={48} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">—</div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{set.title}</p>
              <p className="text-xs text-zinc-500 truncate">{set.genre}{set.mood ? ` · ${MOODS.find(m => m.value === set.mood)?.emoji} ${set.mood.charAt(0) + set.mood.slice(1).toLowerCase()}` : ""}</p>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-400 shrink-0">
              <span className="flex items-center gap-1"><Headphones className="w-3.5 h-3.5" />{set.playsCount.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{set.likesCount.toLocaleString()}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                set.status === "READY" ? "bg-emerald-500/15 text-emerald-400" :
                set.status === "PROCESSING" ? "bg-amber-500/15 text-amber-400" :
                set.status === "FAILED" ? "bg-red-500/15 text-red-400" :
                "bg-zinc-700 text-zinc-400"
              }`}>{set.status}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => openEdit(set)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeletingId(set.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editingId && editState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-100">Edit Set</h2>
              <button onClick={closeEdit} className="text-zinc-400 hover:text-zinc-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Title</label>
                <input
                  value={editState.title}
                  onChange={(e) => setEditState({ ...editState, title: e.target.value })}
                  maxLength={120}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Genre</label>
                <input
                  value={editState.genre}
                  onChange={(e) => setEditState({ ...editState, genre: e.target.value })}
                  maxLength={80}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Mood</label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setEditState({ ...editState, mood: editState.mood === m.value ? null : m.value })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        editState.mood === m.value
                          ? "bg-violet-500 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                      }`}
                    >
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Description</label>
                <textarea
                  value={editState.description}
                  onChange={(e) => setEditState({ ...editState, description: e.target.value })}
                  maxLength={2000}
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={closeEdit}
                className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving || !editState.title.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="w-4 h-4" />
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-100">Delete set?</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  This will permanently delete the set and its audio file. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
