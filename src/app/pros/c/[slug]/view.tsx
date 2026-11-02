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
  if (!cat) return <p className="text-sm text-muted">{t("noPros")}</p>;

  const publicPath = pathname.startsWith("/pros")
    ? pathname.slice("/pros".length) || "/"
    : pathname;

  return (
    <div className="space-y-4">
      <header className="services-horizon animate-rise px-4 py-4 soft-shadow">
        <div className="relative z-[1]">
          <p className="type-sign text-[var(--color-sky)]">{t("browseExpand")}</p>
          <h1 className="type-hero mt-1.5 text-balance">
            {localizedName(cat.names, locale)}
          </h1>
          <p className="mt-2 max-w-[36ch] text-sm leading-snug text-muted">
            {localizedName(cat.descriptions, locale)}
          </p>
        </div>
      </header>

      {pros.length === 0 ? <p className="text-sm text-muted">{t("noPros")}</p> : null}
      <div className="flex flex-wrap gap-1.5">
        {pros.map((pro) => (
          <ProCard key={pro.id} pro={pro} compact />
        ))}
      </div>

      <GuestAuthStrip nextPath={publicPath || `/c/${slug}`} />
    </div>
  );
}
