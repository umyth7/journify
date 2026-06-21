"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AtSign, Music, Globe, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarUpload } from "@/components/profile/AvatarUpload";

interface ProfileData {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  instagram: string | null;
  soundcloud: string | null;
  website: string | null;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setAtSign] = useState("");
  const [soundcloud, setSoundcloud] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data: ProfileData) => {
        setProfile(data);
        setDisplayName(data.displayName ?? "");
        setBio(data.bio ?? "");
        setAtSign(data.instagram ?? "");
        setSoundcloud(data.soundcloud ?? "");
        setWebsite(data.website ?? "");
      })
      .catch(() => setError("Profil yüklenemedi."));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, instagram, soundcloud, website }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Bir hata oluştu.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSuccess = useCallback((newUrl: string) => {
    setProfile((p) => p ? { ...p, avatarUrl: newUrl } : p);
  }, []);

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/profile/${profile.username}`)}
          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-zinc-100">Profili Düzenle</h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <AvatarUpload
          currentUrl={profile.avatarUrl}
          username={profile.username}
          onSuccess={handleAvatarSuccess}
        />
        <p className="text-xs text-zinc-500">Avatar değiştirmek için üzerine tıkla</p>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Username — read-only */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Kullanıcı Adı</label>
          <Input
            value={`@${profile.username}`}
            disabled
            className="bg-zinc-900/50 border-zinc-800 text-zinc-500 cursor-not-allowed"
          />
          <p className="text-xs text-zinc-600">Kullanıcı adı şu an değiştirilemez.</p>
        </div>

        {/* Display name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Görünen İsim</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Sahne adın veya gerçek adın"
            maxLength={60}
            className="bg-zinc-900 border-zinc-700 focus:border-violet-500 text-zinc-100 placeholder:text-zinc-600"
          />
          <p className="text-xs text-zinc-600 text-right">{displayName.length}/60</p>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Kendini tanıt — genre, şehir, vibe…"
            maxLength={300}
            rows={4}
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 text-sm outline-none resize-none transition-all duration-150"
          />
          <p className="text-xs text-zinc-600 text-right">{bio.length}/300</p>
        </div>

        {/* Social links */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Sosyal Linkler</label>

          <div className="relative">
            <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <Input
              value={instagram}
              onChange={(e) => setAtSign(e.target.value)}
              placeholder="instagram.com/kullaniciadi"
              maxLength={200}
              className="bg-zinc-900 border-zinc-700 focus:border-violet-500 text-zinc-100 placeholder:text-zinc-600 pl-10"
            />
          </div>

          <div className="relative">
            <Music className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <Input
              value={soundcloud}
              onChange={(e) => setSoundcloud(e.target.value)}
              placeholder="soundcloud.com/kullaniciadi"
              maxLength={200}
              className="bg-zinc-900 border-zinc-700 focus:border-violet-500 text-zinc-100 placeholder:text-zinc-600 pl-10"
            />
          </div>

          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://senin-siten.com"
              maxLength={200}
              className="bg-zinc-900 border-zinc-700 focus:border-violet-500 text-zinc-100 placeholder:text-zinc-600 pl-10"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full gap-2 min-h-[44px]"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <><Check className="w-4 h-4" /> Kaydedildi</>
          ) : (
            "Kaydet"
          )}
        </Button>
      </div>

      {/* Clerk profile link */}
      {clerkUser && (
        <p className="text-center text-xs text-zinc-600">
          Şifre veya email değiştirmek için{" "}
          <a
            href="https://accounts.clerk.dev/user"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 underline"
          >
            Clerk hesabını
          </a>{" "}
          ziyaret et.
        </p>
      )}
    </div>
  );
}
