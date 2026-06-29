import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";
import { db } from "@/lib/db";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contentType, fileSize } = await req.json() as { contentType: string; fileSize: number };

  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP allowed" }, { status: 400 });
  }
  if (fileSize > MAX_SIZE) {
    return NextResponse.json({ error: "Max 5MB" }, { status: 400 });
  }

  const ext = contentType.split("/")[1];
  const key = `avatars/${userId}/${crypto.randomUUID()}.${ext}`;

  const signedUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );

  const r2PublicUrl = process.env.R2_PUBLIC_URL ?? "";
  const publicUrl = `${r2PublicUrl}/${key}`;
  return NextResponse.json({ signedUrl, publicUrl });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { avatarUrl } = await req.json() as { avatarUrl: string };
  if (!avatarUrl) return NextResponse.json({ error: "Missing avatarUrl" }, { status: 400 });
  const r2PublicUrl = process.env.R2_PUBLIC_URL ?? "";
  if (!avatarUrl.startsWith(r2PublicUrl)) {
    return NextResponse.json({ error: "Invalid avatarUrl" }, { status: 400 });
  }

  await db.user.update({ where: { id: userId }, data: { avatarUrl } });
  return NextResponse.json({ ok: true });
}
