import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 80;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, MAX_NAME) || null : null;

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Geçerli bir email adresi gir." }, { status: 400 });
  }

  const existing = await db.betaSubscriber.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "already_subscribed" });
  }

  await db.betaSubscriber.create({ data: { email, name } });

  return NextResponse.json({ message: "subscribed" }, { status: 201 });
}

// Admin-only: list subscribers (requires ADMIN_SECRET header)
export async function GET(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const subscribers = await db.betaSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return NextResponse.json({ subscribers, total: subscribers.length });
}
