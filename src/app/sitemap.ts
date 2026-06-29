import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { BASE_URL as BASE } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [sets, users] = await Promise.all([
    db.set.findMany({
      where: { status: "READY" },
      select: { id: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
      take: 5000, // TASK-009: guard against unbounded sitemap growth
    }),
    db.user.findMany({
      select: { username: true, updatedAt: true },
      take: 2000, // TASK-009: guard against unbounded sitemap growth
    }),
  ]);

  return [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/search`, changeFrequency: "weekly", priority: 0.8 },
    ...sets.map((s) => ({
      url: `${BASE}/sets/${s.id}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...users.map((u) => ({
      url: `${BASE}/profile/${u.username}`,
      lastModified: u.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
