"use client";

import { useLayoutEffect, useRef, useState } from "react";
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

/** Wider chips go down first so a shorter one can sit in the gap and the list uses fewer lines. */
function packCategoryIds(
  categories: { id: string }[],
  widths: Map<string, number>,
  maxWidth: number,
  gap: number,
) {
  const ordered = [...categories].sort(
    (a, b) => (widths.get(b.id) ?? 0) - (widths.get(a.id) ?? 0),
  );
  const rows: { ids: string[]; used: number }[] = [];
  for (const cat of ordered) {
    const width = widths.get(cat.id) ?? 0;
    let placed = false;
    for (const row of rows) {
      if (row.used + gap + width <= maxWidth - 1) {
        row.ids.push(cat.id);
        row.used += gap + width;
        placed = true;
        break;
      }
    }
    if (!placed) rows.push({ ids: [cat.id], used: width });
  }
  return rows.flatMap((row) => row.ids);
}

export default function ProsHomePage() {
  const { state, actor, t } = usePros();
  const { locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const to = (path: string) => servicesPath(pathname, path);
  const [needOpen, setNeedOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoryListRef = useRef<HTMLDivElement>(null);
  const [packedIds, setPackedIds] = useState<string[] | null>(null);
  const categories = allCategories(state).filter((c) => c.active);
  const categoryKey = categories.map((cat) => cat.id).join("|");
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;
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

  useLayoutEffect(() => {
    if (!categoriesOpen) return;
    const wrap = categoryListRef.current;
    if (!wrap) return;

    const pack = () => {
      const list = categoriesRef.current;
      const style = getComputedStyle(wrap);
      const gap = Number.parseFloat(style.columnGap) || 0;
      const pad =
        (Number.parseFloat(style.paddingLeft) || 0) +
        (Number.parseFloat(style.paddingRight) || 0);
      const maxWidth = wrap.clientWidth - pad;
      if (maxWidth <= 0) return;
      const widths = new Map<string, number>();
      for (const node of wrap.querySelectorAll<HTMLElement>("[data-cat]")) {
        const id = node.dataset.cat;
        if (!id) continue;
        widths.set(id, node.getBoundingClientRect().width);
      }
      if (list.some((cat) => !widths.has(cat.id))) return;
      const next = packCategoryIds(list, widths, maxWidth, gap);
      setPackedIds((prev) =>
        prev && prev.length === next.length && prev.every((id, i) => id === next[i])
          ? prev
          : next,
      );
    };

    pack();
    const observer = new ResizeObserver(pack);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [categoriesOpen, categoryKey, locale]);

  const shownCategories = packedIds
    ? [
        ...packedIds
          .map((id) => categories.find((cat) => cat.id === id))
          .filter((cat): cat is (typeof categories)[number] => Boolean(cat)),
        ...categories.filter((cat) => !packedIds.includes(cat.id)),
      ]
    : categories;

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
          className="flex min-h-12 w-full items-center gap-3 px-3 text-start text-sm font-semibold text-ink"
          aria-expanded={needOpen}
          onClick={() => setNeedOpen((open) => !open)}
        >
          <span className="min-w-0 flex-1">{t("searchPlaceholder")}</span>
          <span className="shrink-0 text-xs font-semibold text-muted">{t("agentMode")}</span>
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
      <section className="rounded-2xl border border-[var(--color-border)] bg-card soft-shadow">
        <button
          type="button"
          className="flex min-h-12 w-full items-center px-3 text-start text-sm font-semibold text-ink"
          aria-expanded={categoriesOpen}
          onClick={() => setCategoriesOpen((open) => !open)}
        >
          {t("popular")}
        </button>
        {categoriesOpen ? (
          <div ref={categoryListRef} className="flex flex-wrap items-start gap-1.5 px-3 pb-3">
            {shownCategories.map((cat) => (
              <Link
                key={cat.id}
                data-cat={cat.id}
                href={to(`/c/${cat.slug}`)}
                className="inline-flex min-h-8 max-w-full items-center gap-1 rounded-xl border border-[var(--color-border)] bg-canvas px-2 py-1"
              >
                <CategoryIcon name={cat.icon} className="size-[0.875rem]" />
                <span className="text-xs font-semibold leading-tight text-ink">{localizedName(cat.names, locale)}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
