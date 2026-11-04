"use client";

import { usePathname } from "next/navigation";
import { GuestAuthStrip } from "@/components/pros/guest-auth-strip";
import { ProCard } from "@/components/pros/parts";
import { localizedName } from "@/lib/pros/catalog";
import { allCategories, filterPros, sortOrganic } from "@/lib/pros/matching";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";

export function CategoryView({ slug }: { slug: string }) {
  const { state, t } = usePros();
  const { locale } = useI18n();
  const pathname = usePathname();
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
  if (!cat) return <p className="text-pf-14 text-pf-text-secondary">{t("noPros")}</p>;

  const publicPath = pathname.startsWith("/pros")
    ? pathname.slice("/pros".length) || "/"
    : pathname;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-balance text-pf-28 font-bold tracking-[-0.02em] text-pf-ink" style={{ viewTransitionName: `pf-cat-${cat.slug}` }}>
          {localizedName(cat.names, locale)}
        </h1>
        <p className="mt-2 max-w-[70ch] text-pf-16 leading-snug text-pf-text-secondary">
          {localizedName(cat.descriptions, locale)}
        </p>
      </header>

      {pros.length === 0 ? <p className="text-pf-16 text-pf-text-secondary">{t("noPros")}</p> : null}
      <div className="space-y-3">
        {pros.map((pro) => (
          <ProCard key={pro.id} pro={pro} />
        ))}
      </div>

      <GuestAuthStrip nextPath={publicPath || `/c/${slug}`} />
    </div>
  );
}
