"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ProCard } from "@/components/pros/parts";
import { Input, Label, Select } from "@/components/ui/input";
import { PROS_LANGS, localizedName } from "@/lib/pros/catalog";
import { allCategories, filterPros, sortOrganic } from "@/lib/pros/matching";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";

function FindInner() {
  const params = useSearchParams();
  const pathname = usePathname();
  const { state, actor, actorReady, t } = usePros();
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
  const start = pathname.startsWith("/pros") ? "/pros/start" : "/start";
  const back = encodeURIComponent(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);

  return (
      <div className="space-y-3">
        <h1 className="font-display text-2xl font-semibold text-ink">{t("findProfessional")}</h1>
        {taskId ? <p className="text-sm text-muted">{t("fromTask")}</p> : null}
        <div className="space-y-1.5">
          <div>
            <Label htmlFor="find-name" className="mb-0.5">{t("findName")}</Label>
            <Input
              id="find-name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("findName")}
              aria-describedby="find-name-note"
            />
            <p id="find-name-note" className="mt-0.5 text-xs leading-snug text-muted">
              {t("findNameNote")}
            </p>
          </div>
          <div>
            <Label htmlFor="find-profession" className="mb-0.5">{t("findProfession")}</Label>
            <Select
              id="find-profession"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              aria-describedby="find-profession-note"
            >
              <option value="">{t("any")}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {localizedName(cat.names, locale)}
                </option>
              ))}
            </Select>
            <p id="find-profession-note" className="mt-0.5 text-xs leading-snug text-muted">
              {t("findProfessionNote")}
            </p>
          </div>
          <div>
            <Label htmlFor="find-language" className="mb-0.5">{t("yourLanguage")}</Label>
            <Select
              id="find-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-describedby="find-language-note"
            >
              <option value="">{t("any")}</option>
              {PROS_LANGS.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </Select>
            <p id="find-language-note" className="mt-0.5 text-xs leading-snug text-muted">
              {t("findLanguageNote")}
            </p>
          </div>
          <label className="flex items-center gap-2 pt-0.5 text-sm">
            <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
            {t("verifiedOnly")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
            {t("filterAvailability")}
          </label>
        </div>
        {pros.length === 0 ? <p className="text-sm text-muted">{t("noPros")}</p> : null}
        <div className="flex flex-wrap gap-1.5">
          {pros.map((pro) => (
            <ProCard key={pro.id} pro={pro} compact />
          ))}
        </div>
        {actorReady && !actor ? (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-muted">{t("trialBody")}</p>
            <div className="flex flex-col gap-1">
              <Link
                href={`${start}?next=${back}`}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-pill)] bg-primary px-4 text-sm font-semibold text-white"
              >
                {t("signUp")}
              </Link>
              <Link
                href={`${start}?mode=sign-in&next=${back}`}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-canvas px-4 text-sm font-semibold text-ink"
              >
                {t("signIn")}
              </Link>
            </div>
          </div>
        ) : null}
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
