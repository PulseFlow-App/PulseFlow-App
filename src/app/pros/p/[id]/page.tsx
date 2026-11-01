import type { Metadata } from "next";
import { SEED_PROFILES } from "@/lib/pros/catalog";
import { ProfileView } from "./view";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pro = SEED_PROFILES.find((row) => row.id === id && row.visibility === "public");
  const name = pro?.name ?? "Pulse Flow Services";
  return {
    title: `${name} · Pulse Flow Services`,
    description: pro?.description ?? "Find a local professional.",
    robots: pro ? undefined : { index: false },
    alternates: { canonical: `https://services.pulseflow.site/p/${id}` },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  return <ProfileView id={id} />;
}
