import type { Metadata } from "next";
import { headers } from "next/headers";
import { ProsShell } from "@/components/pros/shell";
import { servicesMetadataForPath, SERVICES_URL } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const path = headerList.get("x-public-path") ?? "/";
  return servicesMetadataForPath(path);
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pulse Flow Services",
  url: SERVICES_URL,
  description: "Local services, made accessible.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SERVICES_URL}/find?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default async function ProsLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const path = headerList.get("x-public-path") ?? "/";
  return (
    <ProsShell>
      {path === "/" ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      ) : null}
      {children}
    </ProsShell>
  );
}
