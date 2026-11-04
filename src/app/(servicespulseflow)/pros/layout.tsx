import type { Metadata } from "next";
import { headers } from "next/headers";
import { ProsShell } from "@/components/pros/shell";
import { servicesMetadataForPath, SERVICES_URL } from "@/lib/seo";
import { isServicesLocale } from "@/lib/pros/paths";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const path = headerList.get("x-public-path") ?? "/";
  return servicesMetadataForPath(path);
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pulseflow Services",
  url: SERVICES_URL,
  description:
    "Find local plumbers, electricians, cleaners and more. Describe the problem, compare, and book.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SERVICES_URL}/find?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default async function ProsLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const path = headerList.get("x-public-path") ?? "/";
  const lang = headerList.get("x-services-lang");
  const landing = path === "/" || isServicesLocale(path.slice(1));
  return (
    <ProsShell>
      {landing ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              ...websiteJsonLd,
              inLanguage: isServicesLocale(lang) ? lang : "en",
            }),
          }}
        />
      ) : null}
      {children}
    </ProsShell>
  );
}
