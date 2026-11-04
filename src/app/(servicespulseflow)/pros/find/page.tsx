"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProCard } from "@/components/pros/parts";
import { Input, Label, Select } from "@/components/ui/input";
import { LOCALE_META } from "@/lib/i18n";
import { PROS_LANGS, localizedName } from "@/lib/pros/catalog";
import { allCategories, filterPros, sortOrganic } from "@/lib/pros/matching";
import { servicesPath } from "@/lib/pros/paths";
import { isWorkAccount } from "@/lib/pros/intent";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";

function FindInner() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { state, actor, actorReady, t } = usePros();
  const { locale } = useI18n();
  const work = isWorkAccount(actor);

  useEffect(() => {
    if (!actorReady || !work) return;
    router.replace(servicesPath(pathname, "/"));
  }, [actorReady, work, pathname, router]);

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

  if (!actorReady || work) return null;

  return (
      <div className="space-y-3">
        <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("findProfessional")}</h1>
        {taskId ? <p className="text-pf-14 text-pf-text-secondary">{t("fromTask")}</p> : null}
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
            <p id="find-name-note" className="mt-0.5 text-pf-12 leading-snug text-pf-slate-ink">
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
            <p id="find-profession-note" className="mt-0.5 text-pf-12 leading-snug text-pf-slate-ink">
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
                  {LOCALE_META[lang].native}
                </option>
              ))}
            </Select>
            <p id="find-language-note" className="mt-0.5 text-pf-12 leading-snug text-pf-slate-ink">
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
        {pros.length === 0 ? <p className="text-pf-14 text-pf-text-secondary">{t("noPros")}</p> : null}
        <div className="space-y-3">
          {pros.map((pro) => (
            <ProCard key={pro.id} pro={pro} />
          ))}
        </div>
        {actorReady && !actor ? (
          <div className="space-y-2">
            <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{t("signInToSee")}</p>
            <div className="flex flex-col gap-1">
              <Link
                href={servicesPath(pathname, "/register?track=customer")}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-pf-orange-500 px-4 text-pf-16 font-medium text-white active:bg-pf-orange-700"
              >
                {t("signUp")}
              </Link>
              <Link
                href={`${start}?mode=sign-in&next=${back}`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink"
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
