"use client";

import { ProCard } from "@/components/pros/parts";
import { localizedName } from "@/lib/pros/catalog";
import { allCategories, filterPros, sortOrganic } from "@/lib/pros/matching";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";

export function CategoryView({ slug }: { slug: string }) {
  const { state, t } = usePros();
  const { locale } = useI18n();
  const cat = allCategories(state).find((row) => row.slug === slug && row.active);
  const pros = sortOrganic(
    filterPros(state, {
      mode: "public",
      orgId: null,
      placeId: state.placeId,
      categoryId: cat?.id ?? "none",
    }),
    state.reviews,
  );
  if (!cat) return <p className="text-sm text-muted">{t("noPros")}</p>;
  return (
    <div className="space-y-3">
      <h1 className="font-display text-2xl font-semibold text-ink">{localizedName(cat.names, locale)}</h1>
      <p className="text-sm text-muted">{localizedName(cat.descriptions, locale)}</p>
      {pros.length === 0 ? <p className="text-sm text-muted">{t("noPros")}</p> : null}
      <div className="flex flex-wrap gap-1.5">
        {pros.map((pro) => (
          <ProCard key={pro.id} pro={pro} compact />
        ))}
      </div>
    </div>
  );
}
