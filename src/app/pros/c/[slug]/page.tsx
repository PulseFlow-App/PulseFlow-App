import type { Metadata } from "next";
import { CATEGORIES, localizedName } from "@/lib/pros/catalog";
import { CategoryView } from "./view";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = CATEGORIES.find((row) => row.slug === slug);
  const name = cat ? localizedName(cat.names, "en") : "Pulse Flow Services";
  return {
    title: { absolute: cat ? `${name} · Pulse Flow Services` : "Pulse Flow Services" },
    description: cat
      ? `${localizedName(cat.descriptions, "en")} Find a local professional. Pulse Flow Services does not take payment.`
      : "Find a local professional.",
    robots: cat ? { index: true, follow: true } : { index: false, follow: false },
    alternates: { canonical: `https://services.pulseflow.site/c/${slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  return <CategoryView slug={slug} />;
}
