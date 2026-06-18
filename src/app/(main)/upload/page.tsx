"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, Music, ImagePlus, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDuration } from "@/lib/utils";
import { useUpload } from "@/hooks/useUpload";

const GENRES = [
  "Techno", "Minimal Techno", "Dub Techno", "Hard Techno", "Hypnotic Techno",
  "Acid House", "Deep House", "Afro House", "Organic House",
  "Ambient", "Balearic", "Industrial", "Drone", "Experimental",
  "Drum & Bass", "Jungle", "Breaks", "Other",
];

const MIN_DURATION = 2400; // 40 min
const MAX_DURATION = 10800; // 3 hours
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read audio file"));
    };
    audio.src = url;
  });
}

export default function UploadPage() {
  const router = useRouter();
  const { status, progress, error: uploadError, setId, upload, uploadCover, reset } = useUpload();

  // Audio file state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Cover art state
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  // Metadata state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAudioFile = useCallback(async (file: File) => {
    setAudioError(null);

    if (!file.type.startsWith("audio/")) {
      setAudioError("Only audio files are allowed (MP3, WAV, FLAC, AAC, OGG)");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setAudioError("File too large. Maximum 500MB.");
      return;
    }

    try {
      const dur = await getAudioDuration(file);
      if (dur < MIN_DURATION) {
        setAudioError(`Set must be at least 40 minutes long (this is ${Math.floor(dur / 60)} min)`);
        return;
      }
      if (dur > MAX_DURATION) {
        setAudioError(`Set must be 3 hours or less (this is ${Math.floor(dur / 60)} min)`);
        return;
      }
      setAudioFile(file);
      setAudioDuration(dur);
    } catch {
      setAudioError("Could not read audio file. Please try a different file.");
    }
  }, []);

  const handleAudioDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleAudioFile(file);
    },
    [handleAudioFile]
  );

  const handleCoverFile = useCallback((file: File) => {
    setCoverError(null);
    if (!file.type.startsWith("image/")) {
      setCoverError("Only image files are allowed (JPEG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError("Image too large. Maximum 5MB.");
      return;
    }
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(url);
  }, [coverPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !audioDuration || !title || !genre) return;

    let coverUrl: string | undefined;
    if (coverFile) {
      coverUrl = await uploadCover(coverFile) ?? undefined;
    }

    await upload(audioFile, audioDuration, { title, description, genre, coverUrl });
  };

  const isUploading = status === "uploading" || status === "completing";
  const canSubmit = !!audioFile && !!audioDuration && title.trim() && genre && !isUploading;

  // ---- SUCCESS STATE ----
  if (status === "done" && setId) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center space-y-6 animate-fade-in">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Set uploaded!</h1>
          <p className="text-zinc-400 mt-2">Transcoding will begin shortly. Your set will be live once processing completes.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={reset}>Upload another</Button>
          <Button onClick={() => router.push(`/sets/${setId}`)}>View set</Button>
        </div>
      </div>
    );
  }

  // ---- MAIN FORM ----
  return (
    <div className="max-w-2xl mx-auto py-4 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Upload a Set</h1>
        <p className="text-sm text-zinc-500 mt-1">Share your live set with the Journey community. Min 40 min, max 3 hours.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ---- AUDIO FILE DROP ZONE ---- */}
        <section>
          <p className="text-sm font-medium text-zinc-200 mb-2">Audio File <span className="text-red-400" aria-hidden="true">*</span></p>

          {audioFile && audioDuration ? (
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <Music className="w-5 h-5 text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-100 truncate">{audioFile.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {formatDuration(audioDuration)} · {(audioFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => { setAudioFile(null); setAudioDuration(null); }}
                  className="shrink-0 p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors rounded-md hover:bg-zinc-800"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop audio file here or click to browse"
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-150 ${
                isDragging
                  ? "border-violet-500 bg-violet-500/5"
                  : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleAudioDrop}
              onClick={() => audioInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && audioInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-300">Drop your audio file here</p>
              <p className="text-xs text-zinc-600 mt-1">or click to browse · MP3, WAV, FLAC, AAC, OGG · max 500MB</p>
            </div>
          )}

          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAudioFile(f); }}
          />

          {audioError && (
            <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {audioError}
            </p>
          )}
        </section>

        {/* ---- METADATA ---- */}
        <section className="space-y-4">
          <p className="text-sm font-medium text-zinc-200 border-b border-zinc-800 pb-2">Set Details</p>

          <Input
            id="title"
            label="Title"
            placeholder="Subterranean Movement Vol. 7"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-zinc-200">
              Description <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <textarea
              id="description"
              rows={3}
              required
              maxLength={1000}
              placeholder="Tell listeners about this set — the vibe, the venue, the moment."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors duration-150"
            />
            <p className="text-xs text-zinc-600 text-right">{description.length}/1000</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="genre" className="text-sm font-medium text-zinc-200">
              Genre <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <select
              id="genre"
              required
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors duration-150 min-h-[44px]"
            >
              <option value="" disabled className="text-zinc-500">Select a genre</option>
              {GENRES.map((g) => (
                <option key={g} value={g} className="bg-zinc-900">{g}</option>
              ))}
            </select>
          </div>
        </section>

        {/* ---- COVER ART ---- */}
        <section>
          <p className="text-sm font-medium text-zinc-200 mb-2">Cover Art <span className="text-zinc-600 font-normal">(optional)</span></p>

          <div className="flex items-start gap-4">
            {coverPreview ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                <Image src={coverPreview} alt="Cover preview" fill className="object-cover" sizes="96px" />
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => { setCoverFile(null); if (coverPreview) URL.revokeObjectURL(coverPreview); setCoverPreview(null); }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black transition-colors"
                    aria-label="Remove cover art"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-500 flex flex-col items-center justify-center gap-1.5 text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
                aria-label="Add cover art"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs">Add cover</span>
              </button>
            )}
            <div className="text-xs text-zinc-600 pt-1 space-y-1">
              <p>JPEG, PNG or WebP</p>
              <p>Max 5MB</p>
              <p>Square recommended</p>
            </div>
          </div>

          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverFile(f); }}
          />

          {coverError && (
            <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {coverError}
            </p>
          )}
        </section>

        {/* ---- UPLOAD ERROR ---- */}
        {uploadError && (
          <div role="alert" className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* ---- PROGRESS ---- */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {status === "completing" ? "Finalizing…" : "Uploading…"}
              </span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* ---- SUBMIT ---- */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <p className="text-xs text-zinc-600">
            After upload, your set will be transcoded before going live.
          </p>
          <Button
            type="submit"
            size="lg"
            loading={isUploading}
            disabled={!canSubmit}
            className="shrink-0"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            {isUploading ? "Uploading…" : "Upload Set"}
          </Button>
        </div>
      </form>
    </div>
  );
}
