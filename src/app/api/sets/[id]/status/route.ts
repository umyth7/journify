import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const set = await db.set.findUnique({
    where: { id: params.id },
    select: { status: true, audioUrl: true },
  });

  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ status: set.status, audioUrl: set.audioUrl });
}
