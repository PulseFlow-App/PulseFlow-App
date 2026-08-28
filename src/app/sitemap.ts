import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-28");

  return [
    {
      url: appUrl("/login"),
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: appUrl("/register"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: appUrl("/terms"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: appUrl("/privacy"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
