import type { Metadata } from "next";
import { ProsShell } from "@/components/pros/shell";
import { PRODUCT_NAME } from "@/lib/pros/i18n";
import { SERVICES_OG_IMAGE, SERVICES_URL } from "@/lib/seo";

const description = "Local services, made accessible.";

export const metadata: Metadata = {
  title: { absolute: PRODUCT_NAME },
  description,
  applicationName: PRODUCT_NAME,
  alternates: { canonical: `${SERVICES_URL}/` },
  openGraph: {
    type: "website",
    siteName: PRODUCT_NAME,
    title: PRODUCT_NAME,
    description,
    url: `${SERVICES_URL}/`,
    images: [SERVICES_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: PRODUCT_NAME,
    description,
    images: [SERVICES_OG_IMAGE.url],
  },
};

export default function ProsLayout({ children }: { children: React.ReactNode }) {
  return <ProsShell>{children}</ProsShell>;
}
