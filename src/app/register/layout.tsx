import type { Metadata } from "next";
import { headers } from "next/headers";
import { brand } from "@/lib/design-tokens";
import { isMarketplaceHost } from "@/lib/pros/paths";
import { createPageMetadata, servicesMetadataForPath } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  if (isMarketplaceHost(host)) return servicesMetadataForPath("/register");
  return createPageMetadata({
    title: "Create account",
    description: `Create your ${brand.name} account. Start managing property operations with your team in one place.`,
    path: "/register",
  });
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
