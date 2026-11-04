/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
import type { Metadata, MetadataRoute } from "next";
import { brand } from "@/lib/design-tokens";
import { LOCALES } from "@/lib/i18n/types";
import { AREAS, CATEGORIES, localizedName } from "@/lib/pros/catalog";
import { prosT } from "@/lib/pros/i18n";
import { isServicesLocale } from "@/lib/pros/paths";

export const APP_URL = "https://app.pulseflow.site";
export const MARKETING_URL = "https://pulseflow.site";
export const SERVICES_URL = "https://services.pulseflow.site";

export const OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Pulse Flow — The pulse of your rental operations. Property management without the chat chaos.",
} as const;

export const SERVICES_OG_IMAGE = {
  url: "/brand/services-og.jpg",
  width: 1200,
  height: 630,
  alt: "Pulseflow Services — find local plumbers, electricians, cleaners and more.",
} as const;

export function servicesUrl(path = "/"): string {
  if (!path || path === "/") return SERVICES_URL;
  return `${SERVICES_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

const SERVICES_DESCRIPTION =
  "Find local plumbers, electricians, cleaners and more. Describe the problem, compare, and book.";

function servicesLanguageAlternates() {
  return {
    "x-default": SERVICES_URL,
    ...Object.fromEntries(LOCALES.map((code) => [code, servicesUrl(`/${code}`)])),
  };
}

/** Public Services pages search engines should list. Profiles stay out: a full profile needs an account. */
export function servicesIndexable(path: string) {
  const clean = path.split("?")[0] || "/";
  if (clean === "/" || isServicesLocale(clean.slice(1)) || clean === "/find" || clean === "/terms" || clean === "/privacy" || clean === "/register") {
    return true;
  }
  if (clean.startsWith("/c/")) return CATEGORIES.some((row) => clean === `/c/${row.slug}`);
  if (clean.startsWith("/a/")) return AREAS.some((row) => clean === `/a/${row.slug}`);
  return false;
}

export function servicesMetadataForPath(path: string): Metadata {
  const clean = path.split("?")[0] || "/";
  const lang = isServicesLocale(clean.slice(1)) ? clean.slice(1) : clean === "/" ? "en" : "";
  const category = !lang && clean.startsWith("/c/")
    ? CATEGORIES.find((row) => clean === `/c/${row.slug}`)
    : undefined;
  const area = clean.startsWith("/a/")
    ? AREAS.find((row) => clean === `/a/${row.slug}`)
    : undefined;
  const name = category
    ? localizedName(category.names, "en")
    : area
      ? localizedName(area.names, "en")
      : "";
  const description = category
    ? `${localizedName(category.descriptions, "en")} Find a local professional near you. You pay them directly.`
    : area
      ? `Local professionals in ${name}. Describe the problem, compare, and book.`
      : clean === "/find"
        ? "Find a local professional by profession and area. In English, Thai, Russian and Hebrew."
        : clean === "/terms"
          ? "Terms for people looking for a service, and for professionals, on Pulseflow Services."
          : clean === "/privacy"
            ? "Privacy for people looking for a service, and for professionals, on Pulseflow Services."
            : clean === "/register"
              ? "Create a free Pulseflow Services profile so people nearby can find you, or to request work."
              : lang
                ? prosT(lang, "shareDescription")
                : SERVICES_DESCRIPTION;
  const title = name
    ? `${name} · Pulseflow Services`
    : clean === "/find"
      ? "Find a professional · Pulseflow Services"
      : clean === "/terms"
        ? "Terms · Pulseflow Services"
        : clean === "/privacy"
          ? "Privacy · Pulseflow Services"
          : clean === "/register"
            ? "Create an account · Pulseflow Services"
            : `${prosT(lang || "en", "shareTitle")} · Pulseflow Services`;
  const canonical = servicesUrl(clean);
  const index = servicesIndexable(clean);
  const home = clean === "/" || Boolean(lang);
  return {
    title: { absolute: title },
    description,
    applicationName: "Pulseflow Services",
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    alternates: home ? { canonical, languages: servicesLanguageAlternates() } : { canonical },
    openGraph: {
      type: "website",
      siteName: "Pulseflow Services",
      title,
      description,
      url: canonical,
      images: [SERVICES_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SERVICES_OG_IMAGE.url],
    },
  };
}

export function servicesSitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-04");
  const paths = [
    "/",
    ...LOCALES.map((code) => `/${code}`),
    "/find",
    "/register",
    "/terms",
    "/privacy",
    ...CATEGORIES.map((row) => `/c/${row.slug}`),
    ...AREAS.map((row) => `/a/${row.slug}`),
  ];
  return paths.map((path) => ({
    url: servicesUrl(path),
    lastModified,
    changeFrequency: path === "/register" ? "monthly" : path === "/" || path === "/find" || path.startsWith("/c/") || path.startsWith("/a/") ? "weekly" : "yearly",
    priority: path === "/" ? 1 : path === "/find" ? 0.9 : path.startsWith("/c/") || path.startsWith("/a/") ? 0.8 : path === "/register" ? 0.5 : 0.3,
  }));
}

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
