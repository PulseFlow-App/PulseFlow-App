import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register", "/terms", "/privacy", "/support"],
        disallow: [
          "/api/",
          "/auth/",
          "/home",
          "/tasks",
          "/jobs",
          "/bills",
          "/villas",
          "/messages",
          "/notifications",
          "/settings",
          "/reports",
          "/contacts",
          "/endorsements",
          "/join/",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
