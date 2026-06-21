import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const comments = await db.comment.findMany({
    where: { setId: params.id },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      body: true,
      createdAt: true,
      userId: true,
      user: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  });
  return NextResponse.json({ comments });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body } = await req.json() as { body?: string };
  const trimmed = body?.trim().slice(0, 500) ?? "";
  if (!trimmed) return NextResponse.json({ error: "Yorum boş olamaz" }, { status: 400 });

  const set = await db.set.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!set) return NextResponse.json({ error: "Set bulunamadı" }, { status: 404 });

  const comment = await db.comment.create({
    data: { body: trimmed, userId, setId: params.id },
    select: {
      id: true,
      body: true,
      createdAt: true,
      userId: true,
      user: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
