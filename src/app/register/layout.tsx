import type { Metadata } from "next";
import { brand } from "@/lib/design-tokens";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Create account",
  description: `Create your ${brand.name} account. Start managing property operations with your team in one place.`,
  path: "/register",
});

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
