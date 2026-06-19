import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: { username: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const target = await db.user.findUnique({ where: { username: params.username } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === userId) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: userId, followingId: target.id } },
  });

  if (existing) {
    await db.follow.delete({ where: { followerId_followingId: { followerId: userId, followingId: target.id } } });
  } else {
    await db.follow.create({ data: { followerId: userId, followingId: target.id } });
  }

  const followersCount = await db.follow.count({ where: { followingId: target.id } });
  return NextResponse.json({ following: !existing, followersCount });
}
