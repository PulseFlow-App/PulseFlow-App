"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { readPhoto } from "@/components/pros/parts";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { LOCALE_META } from "@/lib/i18n";
import { localizedName } from "@/lib/pros/catalog";
import { allAreas, allCategories, areaName } from "@/lib/pros/matching";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";
import type { ProsUrgency } from "@/lib/pros/types";
import { orderAllowance, SERVICES_PAYMENTS_ENABLED } from "@/lib/pros/trial";
import { prepareVillaPhotoFile } from "@/lib/villas/prepare-photo";
import { todayIsoDate } from "@/lib/villas/status-from-dates";
import {
  intervalsLabel,
  intervalValid,
  parseWhenLabel,
  type TimeInterval,
} from "@/lib/pros/when-label";

const DRAFT_KEY = "pulseflow.services.requestDraft";
const ORDER_LANGS = ["en", "th"] as const;
const ISLAND_SLUGS = ["th-phangan", "th-samui", "th-tao"] as const;
const DEFAULT_INTERVAL: TimeInterval = { start: "09:00", end: "12:00" };

function draftIntervals(preferredTime: string): TimeInterval[] {
  const parsed = parseWhenLabel(`1970-01-01 · ${preferredTime}`);
  if (parsed.intervals.length) return parsed.intervals;
  if (parsed.legacyTime && /^\d{2}:\d{2}$/.test(parsed.legacyTime)) {
    return [{ start: parsed.legacyTime, end: "17:00" }];
  }
  return [{ ...DEFAULT_INTERVAL }];
}

function orderLanguage(code: string) {
  return code === "th" ? "th" : "en";
}

type RequestDraft = {
  categoryId: string;
  title: string;
  description: string;
  photos: string[];
  areaId?: string | null;
  shareLocation?: string;
  urgency: ProsUrgency;
  /** ISO date. Older drafts stored today/tomorrow/this_week/flexible in dateChoice. */
  preferredDate?: string;
  dateChoice?: string;
  preferredTime: string;
  language: string;
  profileId: string | null;
  taskId: string | null;
  orgId: string | null;
  villaId: string | null;
  pending: boolean;
};

function readDraft(): RequestDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RequestDraft;
    return parsed && typeof parsed.title === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function RequestInner() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { state, actor, actorReady, plan, t, createRequest } = usePros();
  const { locale } = useI18n();
  const categories = allCategories(state).filter((c) => c.active);
  const profileParam = params.get("profile");
  const invited = state.profiles.find((pro) => pro.id === profileParam && pro.status === "active");
  const [categoryId, setCategoryId] = useState(params.get("category") ?? categories[0]?.id ?? "");
  const [title, setTitle] = useState(params.get("title") ?? "");
  const [description, setDescription] = useState(params.get("brief") ?? "");
  const [islandId, setIslandId] = useState<string>("");
  const [areaId, setAreaId] = useState<string>("");
  const [shareLocation, setShareLocation] = useState("");
  const [urgency, setUrgency] = useState<ProsUrgency>("flexible");
  const [preferredDate, setPreferredDate] = useState(todayIsoDate);
  const [intervals, setIntervals] = useState<TimeInterval[]>([{ ...DEFAULT_INTERVAL }]);
  const [language, setLanguage] = useState<string>(orderLanguage(locale));
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const places = allAreas(state).filter((area) => area.level === "locality" || area.level === "district");
  const islands = places.filter(
    (area) => area.level === "locality" && ISLAND_SLUGS.includes(area.slug as (typeof ISLAND_SLUGS)[number]),
  );
  const districts = places.filter((area) => area.parentId === islandId && area.level === "district");
  const sent = useRef(false);

  function resolveAreaLabel(selectedAreaId: string) {
    const selected = places.find((area) => area.id === selectedAreaId);
    if (!selected) return areaName(state, selectedAreaId, locale) || null;
    if (selected.level === "district" && selected.parentId) {
      const island = areaName(state, selected.parentId, locale);
      const district = areaName(state, selected.id, locale);
      return island && district ? `${island} · ${district}` : district || island || null;
    }
    return areaName(state, selected.id, locale) || null;
  }
  const gate = actor
    ? orderAllowance(state.requests, state.reviews, actor.id, new Date(), plan.premium)
    : null;

  useEffect(() => {
    const draft = readDraft();
    if (!draft) return;
    setCategoryId(draft.categoryId);
    setTitle(draft.title);
    setDescription(draft.description);
    if (draft.areaId) {
      const selected = places.find((area) => area.id === draft.areaId);
      if (selected?.level === "district" && selected.parentId) {
        setIslandId(selected.parentId);
        setAreaId(selected.id);
      } else if (selected?.level === "locality") {
        setIslandId(selected.id);
        setAreaId("");
      } else {
        setAreaId(draft.areaId);
      }
    }
    setShareLocation(draft.shareLocation ?? "");
    setUrgency(draft.urgency);
    const stored = draft.preferredDate ?? draft.dateChoice ?? "";
    setPreferredDate(/^\d{4}-\d{2}-\d{2}/.test(stored) ? stored.slice(0, 10) : todayIsoDate());
    setIntervals(draftIntervals(draft.preferredTime));
    setLanguage(orderLanguage(draft.language));
    setPhotos(draft.photos ?? []);
    // places is derived from catalog seed; safe for first mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (islandId || !state.placeId) return;
    const selected = places.find((area) => area.id === state.placeId);
    if (selected?.level === "district" && selected.parentId) {
      setIslandId(selected.parentId);
      setAreaId(selected.id);
    } else if (selected?.level === "locality") {
      setIslandId(selected.id);
    }
  }, [islandId, places, state.placeId]);

  const fail = (code: string) => {
    sent.current = false;
    sessionStorage.removeItem(DRAFT_KEY);
    setError(
      code === "rate"
        ? t("rateLimit")
        : code === "duplicate"
          ? t("duplicate")
          : code === "review"
            ? t("reviewRequired")
            : code === "plan"
              ? t("planRequired")
              : code === "nextMonth"
                ? t("nextMonthOrder")
                : code === "missing"
                  ? t("notAvailable")
                  : code === "auth"
                    ? t("requestNeedsAccount")
                    : t("tooShort"),
    );
  };

  useEffect(() => {
    if (params.get("resume") !== "1" || !actorReady || !actor || sent.current) return;
    const draft = readDraft();
    if (!draft?.pending) return;
    const draftArea = draft.areaId || state.placeId;
    const windows = draftIntervals(draft.preferredTime).filter(intervalValid);
    if (!draftArea || !(draft.shareLocation ?? "").trim()) {
      sent.current = false;
      setError(t("needAreaAndLocation"));
      return;
    }
    if (!windows.length) {
      sent.current = false;
      setError(t("needWindows"));
      return;
    }
    sent.current = true;
    const result = createRequest({
      categoryId: draft.categoryId,
      title: draft.title,
      description: draft.description,
      photos: draft.photos ?? [],
      areaId: draftArea,
      areaLabel: resolveAreaLabel(draftArea),
      shareLocation: (draft.shareLocation ?? "").trim(),
      urgency: draft.urgency,
      preferredDate: /^\d{4}-\d{2}-\d{2}/.test(draft.preferredDate ?? "")
        ? draft.preferredDate!.slice(0, 10)
        : todayIsoDate(),
      preferredTime: intervalsLabel(windows),
      language: draft.language,
      taskId: draft.taskId,
      orgId: draft.orgId ?? actor.orgId,
      villaId: draft.villaId,
      invitedProfileId: draft.profileId,
    });
    if (!result.ok) {
      fail(result.error);
      return;
    }
    sessionStorage.removeItem(DRAFT_KEY);
    router.replace(servicesPath(pathname, `/requests/${result.id}`));
  }, [actor, actorReady, createRequest, locale, params, pathname, router, state, t]);

  return (
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!actorReady || !actor) return;
          if (sent.current) return;
          if (!islandId || !areaId || !shareLocation.trim()) {
            setError(t("needAreaAndLocation"));
            return;
          }
          const windows = intervals.filter(intervalValid);
          if (!windows.length) {
            setError(t("needWindows"));
            return;
          }
          sent.current = true;
          const result = createRequest({
            categoryId,
            title,
            description,
            photos,
            areaId,
            areaLabel: resolveAreaLabel(areaId),
            shareLocation: shareLocation.trim(),
            urgency,
            preferredDate,
            preferredTime: intervalsLabel(windows),
            language,
            taskId: params.get("taskId"),
            orgId: params.get("orgId") ?? actor.orgId,
            villaId: params.get("villaId"),
            invitedProfileId: invited?.id ?? null,
          });
          if (!result.ok) {
            fail(result.error);
            return;
          }
          sessionStorage.removeItem(DRAFT_KEY);
          router.push(servicesPath(pathname, `/requests/${result.id}`));
        }}
      >
        <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("sendRequest")}</h1>
        {actorReady && !actor ? <p className="text-pf-14 text-pf-text-secondary">{t("requestNeedsAccount")}</p> : null}
        {gate?.ok && gate.via === "monthly" ? <p className="text-pf-14 text-pf-text-secondary">{t("monthlyNote")}</p> : null}
        {gate?.ok && gate.via === "trial" ? <p className="text-pf-14 text-pf-text-secondary">{t("trialNote")}</p> : null}
        {gate?.ok && gate.via === "plan" && !SERVICES_PAYMENTS_ENABLED ? (
          <p className="text-pf-14 text-pf-text-secondary">{t("billingLater")}</p>
        ) : null}
        {gate && !gate.ok ? (
          <p className="text-pf-14 font-medium text-pf-danger-ink">
            {gate.error === "plan"
              ? t("planRequired")
              : gate.error === "nextMonth"
                ? t("nextMonthOrder")
                : t("reviewRequired")}
          </p>
        ) : null}
        {gate && !gate.ok && (gate.error === "plan" || gate.error === "nextMonth") ? (
          <Link href={servicesPath(pathname, "/settings")} className="text-pf-14 font-medium text-pf-text-secondary">
            {t("openSettings")}
          </Link>
        ) : null}
        {params.get("taskId") ? <p className="text-pf-14 text-pf-text-secondary">{t("fromTask")}</p> : null}
        {invited ? <p className="text-pf-16 text-pf-ink">{t("directTo", { name: invited.name })}</p> : null}
        <div>
          <Label>{t("category")}</Label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {localizedName(cat.names, locale)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t("title")}</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <Label>{t("description")}</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required />
        </div>
        <div>
          <Label>{t("pickIsland")}</Label>
          <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {islands.map((island) => {
              const selected = islandId === island.id;
              return (
                <button
                  key={island.id}
                  type="button"
                  className={
                    selected
                      ? "inline-flex min-h-11 items-center justify-center rounded-full bg-pf-navy-600 px-3 text-pf-14 font-medium text-white"
                      : "inline-flex min-h-11 items-center justify-center rounded-full border border-pf-line bg-pf-card px-3 text-pf-14 font-medium text-pf-ink"
                  }
                  onClick={() => {
                    setIslandId(island.id);
                    setAreaId("");
                    setError(null);
                  }}
                >
                  {areaName(state, island.id, locale)}
                </button>
              );
            })}
          </div>
        </div>
        {islandId ? (
          <div>
            <Label>{t("pickArea")}</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {districts.map((area) => {
                const selected = areaId === area.id;
                return (
                  <button
                    key={area.id}
                    type="button"
                    className={
                      selected
                        ? "inline-flex min-h-11 items-center justify-center rounded-full bg-pf-navy-600 px-3 text-pf-14 font-medium text-white"
                        : "inline-flex min-h-11 items-center justify-center rounded-full border border-pf-line bg-pf-card px-3 text-pf-14 font-medium text-pf-ink"
                    }
                    onClick={() => {
                      setAreaId(area.id);
                      setError(null);
                    }}
                  >
                    {areaName(state, area.id, locale)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <div>
          <Label htmlFor="request-share-location">{t("shareLocation")}</Label>
          <p className="mb-1 text-pf-12 text-pf-slate-ink">{t("shareLocationHint")}</p>
          <Input
            id="request-share-location"
            value={shareLocation}
            required
            placeholder={t("shareLocationPlaceholder")}
            onChange={(e) => setShareLocation(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="request-photos">{t("photos")}</Label>
          <p className="mb-1 text-pf-12 text-pf-slate-ink">{t("photosMax")}</p>
          <label
            htmlFor="request-photos"
            className="flex cursor-pointer items-center gap-2 rounded-[14px] border border-pf-line bg-pf-page px-2 py-1"
          >
            <span className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-pf-peach-100 px-3 text-pf-14 font-medium text-pf-ink">
              {t("addPhoto")}
            </span>
            <span className="text-pf-slate-ink" aria-hidden>
              —
            </span>
            <span className="min-w-0 truncate text-pf-14 text-pf-text-secondary">
              {photos.length === 0 ? t("noPhoto") : t("photosChosen", { count: photos.length })}
            </span>
          </label>
          <input
            id="request-photos"
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={photos.length >= 3}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file || photos.length >= 3) return;
              void prepareVillaPhotoFile(file, 1600)
                .then((prepared) => readPhoto(prepared))
                .then((url) => {
                  if (!url) {
                    setError(t("photoTooBig"));
                    return;
                  }
                  setError(null);
                  setPhotos((prev) => [...prev, url].slice(0, 3));
                })
                .catch(() => setError(t("photoTooBig")));
            }}
          />
          {photos.length > 0 ? (
            <div className="mt-2 flex gap-2">
              {photos.map((url, index) => (
                <div key={url.slice(-24)} className="relative">
                  <img src={url} alt="" className="size-14 rounded-[14px] object-cover" />
                  <button
                    type="button"
                    className="absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-pf-ink text-pf-12 font-medium text-pf-card"
                    aria-label={t("removePhoto")}
                    onClick={() => setPhotos((prev) => prev.filter((_, item) => item !== index))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <Label>{t("urgency")}</Label>
          <Select value={urgency} onChange={(e) => setUrgency(e.target.value as ProsUrgency)}>
            <option value="today">{t("urgent")}</option>
            <option value="this_week">{t("soon")}</option>
            <option value="flexible">{t("notUrgent")}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="request-date">{t("preferredDate")}</Label>
          <Input
            id="request-date"
            type="date"
            value={preferredDate}
            min={todayIsoDate()}
            required
            onChange={(e) => setPreferredDate(e.target.value)}
          />
        </div>
        <div>
          <Label>{t("preferredWindows")}</Label>
          <p className="mb-2 text-pf-12 text-pf-slate-ink">{t("preferredWindowsHint")}</p>
          <div className="space-y-2">
            {intervals.map((interval, index) => (
              <div key={`window-${index}`} className="rounded-[14px] border border-pf-line bg-pf-page p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`request-window-from-${index}`}>{t("windowFrom")}</Label>
                    <Input
                      id={`request-window-from-${index}`}
                      type="time"
                      value={interval.start}
                      step={900}
                      required
                      onChange={(e) => {
                        const start = e.target.value || "09:00";
                        setIntervals((current) => current.map((row, item) => (item === index ? { ...row, start } : row)));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`request-window-to-${index}`}>{t("windowTo")}</Label>
                    <Input
                      id={`request-window-to-${index}`}
                      type="time"
                      value={interval.end}
                      step={900}
                      required
                      onChange={(e) => {
                        const end = e.target.value || "12:00";
                        setIntervals((current) => current.map((row, item) => (item === index ? { ...row, end } : row)));
                      }}
                    />
                  </div>
                </div>
                {intervals.length > 1 ? (
                  <button
                    type="button"
                    className="mt-2 inline-flex min-h-11 items-center text-pf-14 font-medium text-pf-text-secondary"
                    onClick={() => setIntervals((current) => current.filter((_, item) => item !== index))}
                  >
                    {t("removeInterval")}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-14 font-medium text-pf-ink"
            onClick={() => setIntervals((current) => [...current, { start: "14:00", end: "17:00" }])}
          >
            {t("addInterval")}
          </button>
        </div>
        <div>
          <Label>{t("yourLanguage")}</Label>
          <Select value={language} onChange={(e) => setLanguage(orderLanguage(e.target.value))}>
            {ORDER_LANGS.map((lang) => (
              <option key={lang} value={lang}>
                {LOCALE_META[lang].native}
              </option>
            ))}
          </Select>
        </div>
        {error ? <p className="text-pf-14 font-medium text-pf-danger-ink">{error}</p> : null}
        {actorReady && !actor ? (
          <div className="space-y-2">
            <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{t("trialBody")}</p>
            <Link
              href={`${pathname.startsWith("/pros") ? "/pros/start" : "/start"}?next=${encodeURIComponent(servicesPath(pathname, "/request"))}`}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-pf-orange-500 px-4 text-pf-16 font-medium text-white active:bg-pf-orange-700"
            >
              {t("signUp")}
            </Link>
            <Link
              href={`${pathname.startsWith("/pros") ? "/pros/start" : "/start"}?mode=sign-in&next=${encodeURIComponent(servicesPath(pathname, "/request"))}`}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink"
            >
              {t("signIn")}
            </Link>
          </div>
        ) : (
          <Button type="submit" className="min-h-12 w-full" disabled={!actor || Boolean(gate && !gate.ok)}>
            {t("submit")}
          </Button>
        )}
      </form>
  );
}

export default function RequestPage() {
  return (
    <Suspense>
      <RequestInner />
    </Suspense>
  );
}
