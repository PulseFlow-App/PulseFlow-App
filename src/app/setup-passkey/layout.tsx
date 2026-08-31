import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  noIndex: true,
});

export default function SetupPasskeyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
