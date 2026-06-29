import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/constants";

/**
 * TASK-019: Robots.txt
 * - Protects private pages (/dashboard, /profile/edit, /upload) from crawlers
 * - Blocks all /api/* routes
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/profile/edit", "/upload", "/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
