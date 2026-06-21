import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// One-time migration: replace old senssetify.com URLs with correct R2 public URL
// Protected by WORKER_SECRET — call once after deploy, then safe to leave (idempotent)
export async function POST(req: Request) {
  const secret = req.headers.get("x-worker-secret");
  if (!secret || secret !== process.env.WORKER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oldBase = "https://senssetify.com";
  const newBase = process.env.R2_PUBLIC_URL;

  if (!newBase) {
    return NextResponse.json({ error: "R2_PUBLIC_URL not set" }, { status: 500 });
  }

  if (newBase === oldBase) {
    return NextResponse.json({ message: "R2_PUBLIC_URL is still senssetify.com — update env var first" }, { status: 400 });
  }

  // Fix Set audioUrl and coverUrl
  const sets = await db.set.findMany({
    where: {
      OR: [
        { audioUrl: { startsWith: oldBase } },
        { coverUrl: { startsWith: oldBase } },
      ],
    },
    select: { id: true, audioUrl: true, coverUrl: true },
  });

  let setsFixed = 0;
  for (const set of sets) {
    await db.set.update({
      where: { id: set.id },
      data: {
        audioUrl: set.audioUrl.startsWith(oldBase)
          ? set.audioUrl.replace(oldBase, newBase)
          : set.audioUrl,
        ...(set.coverUrl?.startsWith(oldBase)
          ? { coverUrl: set.coverUrl.replace(oldBase, newBase) }
          : {}),
      },
    });
    setsFixed++;
  }

  // Fix User avatarUrl
  const users = await db.user.findMany({
    where: { avatarUrl: { startsWith: oldBase } },
    select: { id: true, avatarUrl: true },
  });

  let usersFixed = 0;
  for (const user of users) {
    await db.user.update({
      where: { id: user.id },
      data: { avatarUrl: user.avatarUrl!.replace(oldBase, newBase) },
    });
    usersFixed++;
  }

  return NextResponse.json({
    ok: true,
    setsFixed,
    usersFixed,
    oldBase,
    newBase,
  });
}
