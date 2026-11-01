import type { Metadata } from "next";
import { AREAS, localizedName } from "@/lib/pros/catalog";
import { AreaView } from "./view";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = AREAS.find((row) => row.slug === slug);
  const name = area ? localizedName(area.names, "en") : "Pulse Flow Services";
  return {
    title: `${name} · Pulse Flow Services`,
    description: `Local professionals in ${name}.`,
    alternates: { canonical: `https://services.pulseflow.site/a/${slug}` },
  };
}

export default async function AreaPage({ params }: Props) {
  const { slug } = await params;
  return <AreaView slug={slug} />;
}
