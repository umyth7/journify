import { NextResponse } from "next/server";

// Migration completed — endpoint removed (TASK-017).
// Returns 410 Gone so any lingering bookmarks/scripts get a clear signal.
export async function POST() {
  return NextResponse.json({ error: "Gone — migration already applied" }, { status: 410 });
}
