import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("CLERK_WEBHOOK_SECRET is not set", { status: 500 });
  }

  const headerList = headers();
  const svixId = headerList.get("svix-id");
  const svixTimestamp = headerList.get("svix-timestamp");
  const svixSignature = headerList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let event: WebhookEvent;
  try {
    event = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "user.created") {
    const { id, username, image_url, first_name, last_name } = event.data;
    await db.user.create({
      data: {
        id,
        username: username ?? id,
        displayName: [first_name, last_name].filter(Boolean).join(" ") || null,
        avatarUrl: image_url || null,
      },
    });
  }

  if (event.type === "user.updated") {
    const { id, username, image_url, first_name, last_name } = event.data;
    await db.user.update({
      where: { id },
      data: {
        username: username ?? id,
        displayName: [first_name, last_name].filter(Boolean).join(" ") || null,
        avatarUrl: image_url || null,
      },
    });
  }

  if (event.type === "user.deleted") {
    const { id } = event.data;
    if (id) {
      await db.user.delete({ where: { id } });
    }
  }

  return new Response(null, { status: 200 });
}
