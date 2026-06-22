import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendFollowNotification } from "@/lib/email";

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

    // Send follow notification email (fire-and-forget, errors don't fail the request)
    try {
      const [followerDbUser, targetClerkUser] = await Promise.all([
        db.user.findUnique({ where: { id: userId }, select: { displayName: true, username: true } }),
        (await clerkClient()).users.getUser(target.id),
      ]);

      const toEmail = targetClerkUser.emailAddresses?.[0]?.emailAddress;
      if (toEmail) {
        const followerName = followerDbUser?.displayName ?? followerDbUser?.username ?? "Birisi";
        const followerUsername = followerDbUser?.username ?? userId;
        const toName = target.displayName ?? target.username;

        // Rate-limit: don't spam — only send if we haven't sent a follow email to this user in the last 24h
        const recentLog = await db.emailNotificationLog.findFirst({
          where: {
            type: "follow",
            toUserId: target.id,
            fromUserId: userId,
            sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });

        if (!recentLog) {
          await Promise.all([
            sendFollowNotification({ toEmail, toName, followerName, followerUsername }),
            db.emailNotificationLog.create({
              data: { type: "follow", toUserId: target.id, fromUserId: userId },
            }),
          ]);
        }
      }
    } catch (err) {
      // Non-fatal — log and continue
      console.error("[follow] email notification error:", err);
    }
  }

  const followersCount = await db.follow.count({ where: { followingId: target.id } });
  return NextResponse.json({ following: !existing, followersCount });
}
