/**
 * Email notification helpers for follower notifications.
 *
 * TASK-004: Batched implementation — avoids N+1 Clerk API calls.
 * Instead of one `getUser(id)` per follower, we:
 *   1. Filter already-notified followers with a single DB query
 *   2. Fetch all Clerk user data in one `getUserList` call
 *   3. Fetch all DB user data in one `findMany` call
 *   4. Send emails in parallel
 */

import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sendNewSetNotification } from "@/lib/email";

export async function notifyFollowersOfNewSet({
  setId,
  setTitle,
  coverUrl,
  artistId,
  artistName,
  artistUsername,
}: {
  setId: string;
  setTitle: string;
  coverUrl: string | null;
  artistId: string;
  artistName: string;
  artistUsername: string;
}) {
  // 1. Get all follower IDs
  const follows = await db.follow.findMany({
    where: { followingId: artistId },
    select: { followerId: true },
  });
  if (follows.length === 0) return;

  const followerIds = follows.map((f) => f.followerId);

  // 2. Filter out followers already notified for this set (single DB query)
  const existingLogs = await db.emailNotificationLog.findMany({
    where: { type: "new_set", setId, toUserId: { in: followerIds } },
    select: { toUserId: true },
  });
  const alreadyNotified = new Set(existingLogs.map((l) => l.toUserId));
  const unnotifiedIds = followerIds.filter((id) => !alreadyNotified.has(id));

  if (unnotifiedIds.length === 0) return;

  // 3. Batch fetch Clerk user data (one API call for all followers)
  const clerk = await clerkClient();
  const clerkUsersResult = await clerk.users.getUserList({
    userId: unnotifiedIds,
    limit: Math.min(unnotifiedIds.length, 500),
  });
  const clerkUserMap = new Map(
    clerkUsersResult.data.map((u) => [u.id, u])
  );

  // 4. Batch fetch DB user data (one query for all followers)
  const dbUsers = await db.user.findMany({
    where: { id: { in: unnotifiedIds } },
    select: { id: true, displayName: true, username: true },
  });
  const dbUserMap = new Map(dbUsers.map((u) => [u.id, u]));

  // 5. Send emails and log in parallel
  await Promise.allSettled(
    unnotifiedIds.map(async (followerId) => {
      try {
        const clerkUser = clerkUserMap.get(followerId);
        const toEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
        if (!toEmail) return;

        const dbUser = dbUserMap.get(followerId);
        const toName = dbUser?.displayName ?? dbUser?.username ?? "there";

        await Promise.all([
          sendNewSetNotification({
            toEmail,
            toName,
            artistName,
            artistUsername,
            setTitle,
            setId,
            coverUrl,
          }),
          db.emailNotificationLog.create({
            data: {
              type: "new_set",
              toUserId: followerId,
              fromUserId: artistId,
              setId,
            },
          }),
        ]);
      } catch (err) {
        console.error(`[notify] follower ${followerId}:`, err);
      }
    })
  );
}
