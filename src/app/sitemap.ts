import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE = "https://www.senssetify.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [sets, users] = await Promise.all([
    db.set.findMany({
      where: { status: "READY" },
      select: { id: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      select: { username: true, updatedAt: true },
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
