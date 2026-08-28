import type { Metadata } from "next";
import { brand } from "@/lib/design-tokens";

export const APP_URL = "https://app.pulseflow.site";
export const MARKETING_URL = "https://pulseflow.site";

export const OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1024,
  height: 665,
  alt: "Pulse Flow - Run everything in one pulse. Property operations for owners and managers.",
} as const;

export function appUrl(path = ""): string {
  if (!path || path === "/") return APP_URL;
  return `${APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function createPageMetadata({
  title,
  description,
  path = "",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const pageDescription = description ?? brand.description;
  const canonical = appUrl(path);

  return {
    title: title ? title : { absolute: brand.name },
    description: pageDescription,
    applicationName: brand.name,
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: path ? { canonical } : undefined,
    openGraph: {
      type: "website",
      siteName: brand.name,
      title: title ? `${title} · ${brand.name}` : brand.name,
      description: pageDescription,
      url: path ? canonical : APP_URL,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} · ${brand.name}` : brand.name,
      description: pageDescription,
      images: [OG_IMAGE.url],
    },
  };
}
