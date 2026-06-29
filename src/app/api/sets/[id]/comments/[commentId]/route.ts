import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * DELETE /api/sets/[id]/comments/[commentId]
 *
 * TASK-038: Both the comment author AND the set owner may delete a comment.
 *   - Comment author: can always remove their own comment.
 *   - Set owner: can moderate (remove any comment on their own set).
 * TASK-037: Uses getCurrentUserId() from auth abstraction layer instead of
 *   importing auth() directly from @clerk/nextjs/server.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const comment = await db.comment.findUnique({
    where: { id: params.commentId },
    select: { userId: true, setId: true },
  });

  if (!comment || comment.setId !== params.id) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }

  // Allow deletion if requester is the comment author or the set owner
  if (comment.userId !== userId) {
    const set = await db.set.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });
    if (!set || set.userId !== userId) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }
  }

  await db.comment.delete({ where: { id: params.commentId } });
  return NextResponse.json({ ok: true });
}
