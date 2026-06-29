"use client";

import { useState, useCallback } from "react";

const PART_SIZE = 10 * 1024 * 1024; // 10MB — must match server

/** Upload up to `limit` parts concurrently (sliding window, no p-limit dep). */
async function uploadPartsParallel<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < tasks.length) {
      const i = nextIndex++;
      results[i] = await tasks[i]();
    }
  };

  // Start `limit` workers; each picks the next available task
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

export type UploadStatus = "idle" | "uploading" | "completing" | "done" | "error";

export interface UploadMetadata {
  title: string;
  description: string;
  genre: string;
  mood?: string;
  coverUrl?: string;
}

interface UseUploadReturn {
  status: UploadStatus;
  progress: number;
  error: string | null;
  setId: string | null;
  upload: (file: File, duration: number, metadata: UploadMetadata) => Promise<void>;
  uploadCover: (file: File) => Promise<string | null>;
  reset: () => void;
}

export function useUpload(): UseUploadReturn {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [setId, setSetId] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setSetId(null);
  }, []);

  const uploadCover = useCallback(async (file: File): Promise<string | null> => {
    try {
      const res = await fetch("/api/sets/cover-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }
      const { signedUrl, publicUrl } = await res.json();
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) throw new Error("Cover upload failed");
      return publicUrl;
    } catch {
      return null;
    }
  }, []);

  const upload = useCallback(async (
    file: File,
    duration: number,
    metadata: UploadMetadata
  ): Promise<void> => {
    setStatus("uploading");
    setProgress(0);
    setError(null);
    setSetId(null);

    let uploadId: string | undefined;
    let key: string | undefined;

    try {
      // 1. Initiate multipart upload
      const initiateRes = await fetch("/api/sets/multipart?action=initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          contentType: file.type,
        }),
      });
      if (!initiateRes.ok) {
        const { error } = await initiateRes.json();
        throw new Error(error);
      }
      const data = await initiateRes.json();
      uploadId = data.uploadId;
      key = data.key;
      const parts: { partNumber: number; signedUrl: string }[] = data.parts;

      // 2. Upload parts in parallel (max 5 concurrent) — 4-5x faster than sequential
      let completedCount = 0;

      const uploadTasks = parts.map(({ partNumber, signedUrl }) => async () => {
        const start = (partNumber - 1) * PART_SIZE;
        const end = Math.min(start + PART_SIZE, file.size);
        const chunk = file.slice(start, end);

        const res = await fetch(signedUrl, {
          method: "PUT",
          body: chunk,
          headers: { "Content-Type": file.type },
        });
        if (!res.ok) throw new Error(`Part ${partNumber} upload failed`);

        // ETag may be quoted — strip quotes for the Complete call
        const etag = (res.headers.get("etag") ?? "").replace(/"/g, "");
        completedCount++;
        setProgress(Math.round((completedCount / parts.length) * 90));
        return { partNumber, etag };
      });

      const uploadedParts = await uploadPartsParallel(uploadTasks, 5);
      // CompleteMultipartUpload requires parts in ascending partNumber order
      const completedParts = uploadedParts.sort((a, b) => a.partNumber - b.partNumber);

      // 3. Complete multipart upload + create DB record
      setStatus("completing");
      const completeRes = await fetch("/api/sets/multipart?action=complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, key, parts: completedParts, metadata, duration }),
      });
      if (!completeRes.ok) {
        const { error } = await completeRes.json();
        throw new Error(error);
      }
      const { setId: newSetId } = await completeRes.json();

      setProgress(100);
      setSetId(newSetId);
      setStatus("done");
    } catch (err) {
      // Best-effort abort to clean up orphaned parts in R2
      if (uploadId && key) {
        fetch("/api/sets/multipart?action=abort", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId, key }),
        }).catch(() => {});
      }
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setStatus("error");
    }
  }, []);

  return { status, progress, error, setId, upload, uploadCover, reset };
}
