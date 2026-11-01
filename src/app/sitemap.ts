import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isMarketplaceHost } from "@/lib/pros/paths";
import { appUrl, servicesSitemap } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  if (isMarketplaceHost(host)) return servicesSitemap();

  const lastModified = new Date("2026-08-28");
  return [
    { url: appUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: appUrl("/login"), lastModified, changeFrequency: "monthly", priority: 0.95 },
    { url: appUrl("/register"), lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: appUrl("/terms"), lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: appUrl("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: appUrl("/support"), lastModified, changeFrequency: "monthly", priority: 0.5 },
  ];
}
