import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getDashboardData(userId);
  return NextResponse.json(data);
}
