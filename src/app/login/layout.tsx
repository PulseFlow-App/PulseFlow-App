import type { Metadata } from "next";
import { brand } from "@/lib/design-tokens";
import { APP_URL, MARKETING_URL, createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Sign in",
  description: `Sign in to ${brand.name}. Villa status, tasks, contacts, and bills for owners and on-site managers.`,
  path: "/login",
});

const loginJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: brand.name,
  url: `${APP_URL}/login`,
  description: brand.description,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  publisher: {
    "@type": "Organization",
    name: brand.name,
    url: MARKETING_URL,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(loginJsonLd) }}
      />
      {children}
    </>
  );
}
