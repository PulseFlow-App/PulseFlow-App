"use client";

import { ProCard } from "@/components/pros/parts";
import { allAreas, filterPros, sortOrganic } from "@/lib/pros/matching";
import { localizedName } from "@/lib/pros/catalog";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";

export function AreaView({ slug }: { slug: string }) {
  const { state, t } = usePros();
  const { locale } = useI18n();
  const area = allAreas(state).find((row) => row.slug === slug);
  const pros = sortOrganic(
    filterPros(state, {
      mode: "public",
      orgId: null,
      placeId: area?.id ?? null,
    }),
    state.reviews,
  );
  return (
    <div className="space-y-4">
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">
        {area ? localizedName(area.names, locale) : t("place")}
      </h1>
      {pros.length === 0 ? <p className="text-pf-14 text-pf-text-secondary">{t("noPros")}</p> : null}
      {pros.map((pro) => (
        <ProCard key={pro.id} pro={pro} />
      ))}
    </div>
  );
}
