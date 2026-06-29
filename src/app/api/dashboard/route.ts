import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDashboardData } from "@/lib/dashboard";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getDashboardData(userId);
  return NextResponse.json(data);
}
