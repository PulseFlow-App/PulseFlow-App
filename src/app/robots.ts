import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isMarketplaceHost } from "@/lib/pros/paths";
import { APP_URL, SERVICES_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  if (isMarketplaceHost(host)) {
    return {
      rules: [
        {
          userAgent: "*",
          allow: ["/", "/find", "/c/", "/a/", "/terms", "/privacy", "/register"],
          disallow: [
            "/api/",
            "/auth/",
            "/settings",
            "/requests",
            "/request",
            "/reply",
            "/claim",
            "/admin",
            "/start",
            "/p/",
            "/join/",
          ],
        },
      ],
      sitemap: `${SERVICES_URL}/sitemap.xml`,
      host: SERVICES_URL,
    };
  }

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
