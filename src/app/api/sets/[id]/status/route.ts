import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyFollowersOfNewSet } from "@/lib/notifications";

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

  // When set becomes READY, notify followers (fire-and-forget, batched Clerk API)
  if (newStatus === "READY" && set.status !== "READY") {
    notifyFollowersOfNewSet({
      setId: set.id,
      setTitle: set.title,
      coverUrl: set.coverUrl,
      artistId: set.userId,
      artistName: set.user.displayName ?? set.user.username,
      artistUsername: set.user.username,
    }).catch((err) => console.error("[status patch] notification error:", err));
  }

  return NextResponse.json({ ok: true });
}
