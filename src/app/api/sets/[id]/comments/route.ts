import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const rawLimit = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
  const limit = Math.min(isNaN(rawLimit) || rawLimit < 1 ? DEFAULT_LIMIT : rawLimit, MAX_LIMIT);

  const comments = await db.comment.findMany({
    where: { setId: params.id },
    orderBy: { createdAt: "asc" },
    take: limit + 1,
    ...(cursor
      ? { skip: 1, cursor: { id: cursor } }
      : {}),
    select: {
      id: true,
      body: true,
      createdAt: true,
      userId: true,
      user: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  });

  const hasMore = comments.length > limit;
  const page = hasMore ? comments.slice(0, limit) : comments;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return NextResponse.json({ comments: page, nextCursor });
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
