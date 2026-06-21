import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

const MAX_DISPLAY_NAME = 60;
const MAX_BIO = 300;
const MAX_URL = 200;

function sanitizeText(val: unknown, max: number): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed.slice(0, max) : null;
}

function sanitizeUrl(val: unknown): string | null {
  const text = sanitizeText(val, MAX_URL);
  if (!text) return null;
  // Accept handles (no protocol) or full URLs starting with http/https
  if (text.startsWith("http://") || text.startsWith("https://") || !text.includes("://")) {
    return text;
  }
  return null;
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const displayName = sanitizeText(body.displayName, MAX_DISPLAY_NAME);
  const bio = sanitizeText(body.bio, MAX_BIO);
  const instagram = sanitizeUrl(body.instagram);
  const soundcloud = sanitizeUrl(body.soundcloud);
  const website = sanitizeUrl(body.website);

  const user = await db.user.update({
    where: { id: userId },
    data: {
      ...(displayName !== undefined ? { displayName } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(instagram !== undefined ? { instagram } : {}),
      ...(soundcloud !== undefined ? { soundcloud } : {}),
      ...(website !== undefined ? { website } : {}),
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      instagram: true,
      soundcloud: true,
      website: true,
    },
  });

  return NextResponse.json(user);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      instagram: true,
      soundcloud: true,
      website: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}
