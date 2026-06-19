import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db.like.findUnique({
    where: { userId_setId: { userId, setId: params.id } },
  });

  if (existing) {
    await db.like.delete({ where: { userId_setId: { userId, setId: params.id } } });
  } else {
    await db.like.create({ data: { userId, setId: params.id } });
  }

  const likesCount = await db.like.count({ where: { setId: params.id } });
  return NextResponse.json({ liked: !existing, likesCount });
}
