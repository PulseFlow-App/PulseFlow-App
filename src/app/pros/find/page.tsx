"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProCard } from "@/components/pros/parts";
import { Input, Select } from "@/components/ui/input";
import { PROS_LANGS, localizedName } from "@/lib/pros/catalog";
import { allCategories, filterPros, sortOrganic } from "@/lib/pros/matching";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";

function FindInner() {
  const params = useSearchParams();
  const { state, actor, t } = usePros();
  const { locale } = useI18n();
  const [categoryId, setCategoryId] = useState(params.get("category") ?? "");
  const [language, setLanguage] = useState("");
  const [verified, setVerified] = useState(false);
  const [available, setAvailable] = useState(false);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const taskId = params.get("taskId");
  const categories = allCategories(state).filter((c) => c.active);
  const pros = useMemo(
    () =>
      sortOrganic(
        filterPros(state, {
          mode: taskId && actor?.orgId ? "team" : "public",
          orgId: actor?.orgId ?? null,
          placeId: state.placeId,
          categoryId: categoryId || null,
          language: language || null,
          verified,
          available,
          query,
        }),
        state.reviews,
      ),
    [state, actor?.orgId, taskId, categoryId, language, verified, available, query],
  );

  return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold text-ink">{t("findProfessional")}</h1>
        {taskId ? <p className="text-sm text-muted">{t("fromTask")}</p> : null}
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("nameSearch")} aria-label={t("nameSearch")} className="min-h-12" />
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label={t("category")}>
          <option value="">{t("any")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {localizedName(cat.names, locale)}
            </option>
          ))}
        </Select>
        <Select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label={t("yourLanguage")}>
          <option value="">{t("any")}</option>
          {PROS_LANGS.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </Select>
        <label className="flex min-h-12 items-center gap-2 text-sm">
          <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
          {t("verifiedOnly")}
        </label>
        <label className="flex min-h-12 items-center gap-2 text-sm">
          <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
          {t("filterAvailability")}
        </label>
        {pros.length === 0 ? <p className="text-sm text-muted">{t("noPros")}</p> : null}
        {pros.map((pro) => (
          <ProCard key={pro.id} pro={pro} />
        ))}
      </div>
  );
}

export default function FindPage() {
  return (
    <Suspense>
      <FindInner />
    </Suspense>
  );
}
