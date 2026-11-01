"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NeedBrief } from "@/components/pros/need-brief";
import { CategoryIcon, ProCard } from "@/components/pros/parts";
import { Button } from "@/components/ui/button";
import { localizedName } from "@/lib/pros/catalog";
import { allCategories } from "@/lib/pros/matching";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";

export default function ProsHomePage() {
  const { state, actor, t } = usePros();
  const { locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const to = (path: string) => servicesPath(pathname, path);
  const [needOpen, setNeedOpen] = useState(false);
  const categories = allCategories(state).filter((c) => c.active);
  const active = actor
    ? state.requests.filter(
        (row) => row.createdBy === actor.id && row.status !== "completed" && row.status !== "cancelled",
      )
    : [];
  const saved = (actor ? state.favourites[actor.id] ?? [] : [])
    .map((id) => state.profiles.find((pro) => pro.id === id))
    .filter((pro): pro is NonNullable<typeof pro> => Boolean(pro && pro.status === "active"));
  const recentIds: string[] = [];
  if (actor) {
    for (const row of state.requests) {
      if (row.createdBy !== actor.id || !row.chosenProfileId) continue;
      if (!recentIds.includes(row.chosenProfileId)) recentIds.push(row.chosenProfileId);
    }
  }
  const recent = recentIds
    .map((id) => state.profiles.find((pro) => pro.id === id))
    .filter((pro): pro is NonNullable<typeof pro> => Boolean(pro && pro.status === "active"))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-title text-ink">{t("tagline")}</h1>
      </div>
      <div className="grid gap-2">
        <Button className="min-h-12 w-full" reflectGlobalBusy={false} onClick={() => router.push(to("/find"))}>
          {t("findProfessional")}
        </Button>
        <Button variant="ghost" className="min-h-12 w-full" reflectGlobalBusy={false} onClick={() => router.push(to("/request"))}>
          {t("describeNeed")}
        </Button>
      </div>
      <section className="rounded-2xl border border-[var(--color-border)] bg-card soft-shadow">
        <button
          type="button"
          className="flex min-h-12 w-full items-center px-3 text-start text-sm font-semibold text-ink"
          aria-expanded={needOpen}
          onClick={() => setNeedOpen((open) => !open)}
        >
          {t("searchPlaceholder")}
        </button>
        {needOpen ? (
          <div className="px-3 pb-3">
            <NeedBrief embedded />
          </div>
        ) : null}
      </section>
      {active.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">{t("active")}</h2>
          {active.slice(0, 3).map((row) => (
            <Link key={row.id} href={to(`/requests/${row.id}`)} className="block rounded-2xl border border-[var(--color-border)] bg-card px-3 py-3">
              <p className="text-sm font-semibold text-ink">{row.title}</p>
            </Link>
          ))}
        </section>
      ) : null}
      {saved.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">{t("favourites")}</h2>
          {saved.map((pro) => <ProCard key={pro.id} pro={pro} />)}
        </section>
      ) : null}
      {recent.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">{t("recent")}</h2>
          {recent.map((pro) => <ProCard key={pro.id} pro={pro} />)}
        </section>
      ) : null}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">{t("popular")}</h2>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={to(`/c/${cat.slug}`)}
              className="flex min-h-14 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-card px-3 py-2 soft-shadow"
            >
              <CategoryIcon name={cat.icon} className="size-6" />
              <span className="text-sm font-semibold text-ink">{localizedName(cat.names, locale)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
