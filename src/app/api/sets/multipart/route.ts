import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";
import { db } from "@/lib/db";
import { sendNewSetNotification } from "@/lib/email";

const PART_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const MIN_DURATION = 2400; // 40 minutes in seconds
const MAX_DURATION = 10800; // 3 hours in seconds
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/flac", "audio/aac", "audio/ogg"];

// DB-based rate limit: max 10 uploads initiated per user per hour
const UPLOAD_RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

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
      return NextResponse.json({ error: "File too large. Maximum 2GB." }, { status: 400 });
    }

    // Rate limit: check how many sets this user started in the last hour
    const windowStart = new Date(Date.now() - RATE_WINDOW_MS);
    const recentCount = await db.set.count({
      where: { userId, createdAt: { gte: windowStart } },
    });
    if (recentCount >= UPLOAD_RATE_LIMIT) {
      return NextResponse.json(
        { error: "Upload limit reached. Maximum 10 uploads per hour." },
        { status: 429 }
      );
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

    // Ensure user exists in DB (webhook may not have fired yet)
    // Always upsert — currentUser() can be null if Clerk API is slow, but userId is always valid
    const clerkUser = await currentUser();
    await db.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        username: clerkUser?.username ?? userId,
      },
    });

    // Sanitize metadata inputs
    const title = metadata.title?.trim().slice(0, 120);
    const description = metadata.description?.trim().slice(0, 2000);
    const genre = metadata.genre?.trim().slice(0, 80);
    if (!title || !description || !genre) {
      return NextResponse.json({ error: "Title, description and genre are required." }, { status: 400 });
    }

    const VALID_MOODS = ["HYPNOTIC","EUPHORIC","TRIBAL","FLOATING","DARK","MELANCHOLIC","RAW","COSMIC"];
    const workerUrl = process.env.TRANSCODING_WORKER_URL;

    const set = await db.set.create({
      data: {
        title,
        description,
        genre,
        mood: metadata.mood && VALID_MOODS.includes(metadata.mood) ? (metadata.mood as import("@prisma/client").Mood) : null,
        duration: Math.floor(duration),
        audioUrl,
        coverUrl: metadata.coverUrl ?? null,
        status: "PROCESSING",
        userId,
      },
    });

    if (workerUrl) {
      // Fire-and-forget to transcoding worker
      fetch(`${workerUrl}/transcode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-worker-secret": process.env.WORKER_SECRET ?? "",
        },
        body: JSON.stringify({ setId: set.id, key }),
      }).catch((err) => console.error("[worker trigger] failed:", err));
    } else {
      // No worker configured — mark ready immediately so set is playable
      await db.set.update({ where: { id: set.id }, data: { status: "READY" } });
      // Notify followers immediately since set is ready now
      notifyFollowersOfNewSet({
        id: set.id,
        title,
        coverUrl: metadata.coverUrl ?? null,
        userId,
        artistName: clerkUser?.username ?? userId,
        artistUsername: clerkUser?.username ?? userId,
      }).catch((err) => console.error("[multipart] notification error:", err));
    }

    return NextResponse.json({ setId: set.id, status: workerUrl ? "PROCESSING" : "READY" });
  }

  // --- ABORT ---
  if (action === "abort") {
    const { uploadId, key } = await req.json() as { uploadId: string; key: string };
    await r2.send(new AbortMultipartUploadCommand({ Bucket: R2_BUCKET, Key: key, UploadId: uploadId }));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

async function notifyFollowersOfNewSet({
  id,
  title,
  coverUrl,
  userId,
  artistName,
  artistUsername,
}: {
  id: string;
  title: string;
  coverUrl: string | null;
  userId: string;
  artistName: string;
  artistUsername: string;
}) {
  const follows = await db.follow.findMany({
    where: { followingId: userId },
    select: { followerId: true },
  });
  if (follows.length === 0) return;

  const BATCH = 10;
  for (let i = 0; i < follows.length; i += BATCH) {
    const batch = follows.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async ({ followerId }) => {
        try {
          const recentLog = await db.emailNotificationLog.findFirst({
            where: { type: "new_set", toUserId: followerId, setId: id },
          });
          if (recentLog) return;

          const clerkUserFollower = await (await clerkClient()).users.getUser(followerId);
          const toEmail = clerkUserFollower.emailAddresses?.[0]?.emailAddress;
          if (!toEmail) return;

          const toDbUser = await db.user.findUnique({
            where: { id: followerId },
            select: { displayName: true, username: true },
          });
          const toName = toDbUser?.displayName ?? toDbUser?.username ?? "there";

          await Promise.all([
            sendNewSetNotification({ toEmail, toName, artistName, artistUsername, setTitle: title, setId: id, coverUrl }),
            db.emailNotificationLog.create({
              data: { type: "new_set", toUserId: followerId, fromUserId: userId, setId: id },
            }),
          ]);
        } catch (err) {
          console.error(`[multipart notify] follower ${followerId}:`, err);
        }
      })
    );
  }
}
