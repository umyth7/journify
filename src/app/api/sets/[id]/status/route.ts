import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sendNewSetNotification } from "@/lib/email";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const set = await db.set.findUnique({
    where: { id: params.id },
    select: { status: true, audioUrl: true },
  });

  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ status: set.status, audioUrl: set.audioUrl });
}

/**
 * Called by the transcoding worker when a set is done.
 * Body: { status: "READY" | "FAILED", audioUrl?: string }
 * Auth: x-worker-secret header
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const secret = req.headers.get("x-worker-secret");
  if (!secret || secret !== process.env.WORKER_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const newStatus = body.status as string;
  const audioUrl = typeof body.audioUrl === "string" ? body.audioUrl : undefined;

  if (!["READY", "FAILED", "PROCESSING"].includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const set = await db.set.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      coverUrl: true,
      status: true,
      userId: true,
      user: { select: { id: true, username: true, displayName: true } },
    },
  });

  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.set.update({
    where: { id: params.id },
    data: {
      status: newStatus as import("@prisma/client").SetStatus,
      ...(audioUrl ? { audioUrl } : {}),
    },
  });

  // When set becomes READY, notify followers (fire-and-forget)
  if (newStatus === "READY" && set.status !== "READY") {
    notifyFollowers(set).catch((err) =>
      console.error("[status patch] notification error:", err)
    );
  }

  return NextResponse.json({ ok: true });
}

async function notifyFollowers(set: {
  id: string;
  title: string;
  coverUrl: string | null;
  userId: string;
  user: { id: string; username: string; displayName: string | null };
}) {
  // Get all followers of the artist
  const follows = await db.follow.findMany({
    where: { followingId: set.userId },
    select: { followerId: true },
  });

  if (follows.length === 0) return;

  const artistName = set.user.displayName ?? set.user.username;

  // Process in batches of 10 to avoid hammering Clerk API
  const BATCH = 10;
  for (let i = 0; i < follows.length; i += BATCH) {
    const batch = follows.slice(i, i + BATCH);

    await Promise.all(
      batch.map(async ({ followerId }) => {
        try {
          // Check for recent notification to avoid duplicates
          const recentLog = await db.emailNotificationLog.findFirst({
            where: {
              type: "new_set",
              toUserId: followerId,
              setId: set.id,
            },
          });
          if (recentLog) return;

          const clerkUser = await (await clerkClient()).users.getUser(followerId);
          const toEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
          if (!toEmail) return;

          const toDbUser = await db.user.findUnique({
            where: { id: followerId },
            select: { displayName: true, username: true },
          });
          const toName = toDbUser?.displayName ?? toDbUser?.username ?? "there";

          await Promise.all([
            sendNewSetNotification({
              toEmail,
              toName,
              artistName,
              artistUsername: set.user.username,
              setTitle: set.title,
              setId: set.id,
              coverUrl: set.coverUrl,
            }),
            db.emailNotificationLog.create({
              data: {
                type: "new_set",
                toUserId: followerId,
                fromUserId: set.userId,
                setId: set.id,
              },
            }),
          ]);
        } catch (err) {
          console.error(`[notify] follower ${followerId} error:`, err);
        }
      })
    );
  }
}
