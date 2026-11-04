import type { Metadata } from "next";
import { SEED_PROFILES } from "@/lib/pros/catalog";
import { ProfileView } from "./view";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pro = SEED_PROFILES.find((row) => row.id === id && row.visibility === "public");
  return {
    title: { absolute: pro ? `${pro.name} · Pulseflow Services` : "Pulseflow Services" },
    description: "A full profile opens after you create a Pulseflow Services account.",
    robots: { index: false, follow: false },
    alternates: { canonical: `https://services.pulseflow.site/p/${id}` },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  return <ProfileView id={id} />;
}
