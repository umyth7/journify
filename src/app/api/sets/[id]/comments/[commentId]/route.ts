import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const comment = await db.comment.findUnique({
    where: { id: params.commentId },
    select: { userId: true, setId: true },
  });

  if (!comment || comment.setId !== params.id) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
  if (comment.userId !== userId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  await db.comment.delete({ where: { id: params.commentId } });
  return NextResponse.json({ ok: true });
}
