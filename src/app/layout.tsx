import type { Metadata, Viewport } from "next";
import {
  Nunito,
  Noto_Sans,
  Noto_Sans_Arabic,
  Noto_Sans_Thai,
  Noto_Sans_Hebrew,
  Noto_Sans_Myanmar,
} from "next/font/google";
import { brand, colors } from "@/lib/design-tokens";
import { APP_URL, OG_IMAGE } from "@/lib/seo";
import { Providers } from "@/components/providers";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-pulse",
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

const hebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hebrew",
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

export const metadata: Metadata = {
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

export const viewport: Viewport = {
  themeColor: colors.background,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${nunito.variable} ${noto.variable} ${thai.variable} ${hebrew.variable} ${myanmar.variable} ${arabic.variable} h-full`}
    >
      <body
        className={`${nunito.className} min-h-full antialiased`}
        style={{
          fontFamily:
            "var(--font-pulse), var(--font-noto), var(--font-thai), var(--font-hebrew), var(--font-myanmar), var(--font-arabic), system-ui, sans-serif",
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
