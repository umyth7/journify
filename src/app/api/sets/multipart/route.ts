import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";
import { db } from "@/lib/db";

const PART_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MIN_DURATION = 2400; // 40 minutes in seconds
const MAX_DURATION = 10800; // 3 hours in seconds
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/flac", "audio/aac", "audio/ogg"];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // --- INITIATE ---
  if (action === "initiate") {
    const body = await req.json();
    const { filename, fileSize, contentType } = body as {
      filename: string;
      fileSize: number;
      contentType: string;
    };

    if (!ALLOWED_AUDIO_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Only audio files are allowed (MP3, WAV, FLAC, AAC, OGG)" }, { status: 400 });
    }
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 500MB." }, { status: 400 });
    }

    const ext = filename.split(".").pop() ?? "mp3";
    const key = `audio/${userId}/${crypto.randomUUID()}.${ext}`;
    const partCount = Math.ceil(fileSize / PART_SIZE);

    const { UploadId } = await r2.send(
      new CreateMultipartUploadCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ContentType: contentType,
      })
    );

    const parts = await Promise.all(
      Array.from({ length: partCount }, (_, i) =>
        getSignedUrl(
          r2,
          new UploadPartCommand({
            Bucket: R2_BUCKET,
            Key: key,
            UploadId,
            PartNumber: i + 1,
          }),
          { expiresIn: 3600 }
        ).then((signedUrl) => ({ partNumber: i + 1, signedUrl }))
      )
    );

    return NextResponse.json({ uploadId: UploadId, key, parts });
  }

  // --- COMPLETE ---
  if (action === "complete") {
    const body = await req.json();
    const { uploadId, key, parts, metadata, duration } = body as {
      uploadId: string;
      key: string;
      parts: { partNumber: number; etag: string }[];
      metadata: { title: string; description: string; genre: string; mood?: string; coverUrl?: string };
      duration: number;
    };

    if (duration < MIN_DURATION || duration > MAX_DURATION) {
      // Abort the incomplete upload to avoid orphaned parts
      await r2.send(new AbortMultipartUploadCommand({ Bucket: R2_BUCKET, Key: key, UploadId: uploadId }));
      return NextResponse.json(
        { error: `Duration must be between 40 minutes and 3 hours (got ${Math.floor(duration / 60)} min)` },
        { status: 400 }
      );
    }

    await r2.send(
      new CompleteMultipartUploadCommand({
        Bucket: R2_BUCKET,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map(({ partNumber, etag }) => ({
            PartNumber: partNumber,
            ETag: etag,
          })),
        },
      })
    );

    const audioUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    const VALID_MOODS = ["HYPNOTIC","EUPHORIC","TRIBAL","FLOATING","DARK","MELANCHOLIC","RAW","COSMIC"];
    const workerUrl = process.env.TRANSCODING_WORKER_URL;
    const hasWorker = !!workerUrl;

    const set = await db.set.create({
      data: {
        title: metadata.title.trim(),
        description: metadata.description.trim(),
        genre: metadata.genre,
        mood: metadata.mood && VALID_MOODS.includes(metadata.mood) ? (metadata.mood as import("@prisma/client").Mood) : null,
        duration: Math.floor(duration),
        audioUrl,
        coverUrl: metadata.coverUrl ?? null,
        status: hasWorker ? "PROCESSING" : "READY",
        userId,
      },
    });

    // Fire-and-forget to transcoding worker (if configured)
    if (hasWorker) {
      fetch(`${workerUrl}/transcode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-worker-secret": process.env.WORKER_SECRET ?? "",
        },
        body: JSON.stringify({ setId: set.id, key }),
      }).catch((err) => console.error("[worker trigger] failed:", err));
    }

    return NextResponse.json({ setId: set.id, status: set.status });
  }

  // --- ABORT ---
  if (action === "abort") {
    const { uploadId, key } = await req.json() as { uploadId: string; key: string };
    await r2.send(new AbortMultipartUploadCommand({ Bucket: R2_BUCKET, Key: key, UploadId: uploadId }));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
