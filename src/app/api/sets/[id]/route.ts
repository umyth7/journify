import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { r2, R2_BUCKET } from "@/lib/r2";

const MOOD_VALUES = ["HYPNOTIC", "EUPHORIC", "TRIBAL", "FLOATING", "DARK", "MELANCHOLIC", "RAW", "COSMIC", "COFFEE"] as const;

function urlToKey(url: string): string {
  const base = process.env.R2_PUBLIC_URL ?? "";
  return url.replace(base + "/", "");
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const set = await db.set.findUnique({ where: { id: params.id }, select: { userId: true } });
  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (set.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : undefined;
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 2000) : undefined;
  const genre = typeof body.genre === "string" ? body.genre.trim().slice(0, 80) : undefined;
  const mood = MOOD_VALUES.includes(body.mood) ? body.mood : body.mood === null ? null : undefined;

  if (title !== undefined && !title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const updated = await db.set.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(genre !== undefined && { genre }),
      ...(mood !== undefined && { mood }),
    },
    select: { id: true, title: true, description: true, genre: true, mood: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const set = await db.set.findUnique({
    where: { id: params.id },
    select: { userId: true, audioUrl: true, coverUrl: true },
  });
  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (set.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.set.delete({ where: { id: params.id } });

  const deletePromises: Promise<unknown>[] = [
    r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: urlToKey(set.audioUrl) })),
  ];
  if (set.coverUrl) {
    deletePromises.push(r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: urlToKey(set.coverUrl) })));
  }
  await Promise.allSettled(deletePromises);

  return new NextResponse(null, { status: 204 });
}
