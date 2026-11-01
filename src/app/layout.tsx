/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import {
  Heebo,
  Sora,
  Noto_Sans,
  Noto_Sans_Arabic,
  Noto_Sans_Thai,
  Noto_Sans_Myanmar,
} from "next/font/google";
import { brand, colors } from "@/lib/design-tokens";
import { APPEARANCE_BOOT_SCRIPT } from "@/lib/appearance/apply";
import { APP_URL, OG_IMAGE, SERVICES_OG_IMAGE, SERVICES_URL } from "@/lib/seo";
import { isMarketplaceHost } from "@/lib/pros/paths";
import { Providers } from "@/components/providers";
import "./globals.css";

/** Horizon body / Hebrew + Latin (DESIGN.md) — max weight 700 */
const heebo = Heebo({
  subsets: ["latin", "latin-ext", "hebrew"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pulse",
  display: "swap",
});

/** Horizon display / H1–H2 — Latin only; RTL falls back to Heebo */
const sora = Sora({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-display-face",
  display: "swap",
});

const noto = Noto_Sans({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
  display: "swap",
});

const thai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-thai",
  display: "swap",
});

const myanmar = Noto_Sans_Myanmar({
  subsets: ["myanmar"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-myanmar",
  display: "swap",
});

const arabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

const appMetadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: brand.name,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: brand.name,
    description: brand.description,
    url: APP_URL,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: brand.name,
    description: brand.description,
    images: [OG_IMAGE.url],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: brand.name,
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "og:image:width": String(OG_IMAGE.width),
    "og:image:height": String(OG_IMAGE.height),
  },
};

const servicesDescription = "Local services, made accessible.";

const servicesMetadata: Metadata = {
  ...appMetadata,
  metadataBase: new URL(SERVICES_URL),
  title: {
    default: "Pulse Flow Services",
    template: "%s · Pulse Flow Services",
  },
  applicationName: "Pulse Flow Services",
  description: servicesDescription,
  manifest: "/services.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pulse Flow Services",
  },
  icons: {
    icon: [
      { url: "/brand/services-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/services-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/services-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/services-icon-180.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: "Pulse Flow Services",
    title: "Pulse Flow Services",
    description: servicesDescription,
    url: SERVICES_URL,
    images: [SERVICES_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulse Flow Services",
    description: servicesDescription,
    images: [SERVICES_OG_IMAGE.url],
  },
  other: {
    "og:image:width": String(SERVICES_OG_IMAGE.width),
    "og:image:height": String(SERVICES_OG_IMAGE.height),
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  return isMarketplaceHost(host) ? servicesMetadata : appMetadata;
}

export const viewport: Viewport = {
  themeColor: colors.background,
  width: "device-width",
  initialScale: 1,
  // Allow pinch-zoom (WCAG / store a11y). Locked zoom is a common reject reason.
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const site = isMarketplaceHost(host) ? "services" : "app";

  return (
    <html
      lang="en"
      data-site={site}
      suppressHydrationWarning
      className={`${heebo.variable} ${sora.variable} ${noto.variable} ${thai.variable} ${myanmar.variable} ${arabic.variable} h-full`}
    >
      <body
        className={`${heebo.className} min-h-full antialiased`}
        style={{
          fontFamily:
            "var(--font-pulse), var(--font-noto), var(--font-thai), var(--font-myanmar), var(--font-arabic), system-ui, sans-serif",
        }}
      >
        <Script
          id="pulse-appearance-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
