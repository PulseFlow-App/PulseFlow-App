"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Camera, Mic } from "lucide-react";
import { CategoryIcon, readPhoto } from "@/components/pros/parts";
import { LOCALE_META, type Locale } from "@/lib/i18n";
import { localizedName } from "@/lib/pros/catalog";
import { suggestFromBrief } from "@/lib/pros/brief";
import { allCategories, categoryName, filterPros } from "@/lib/pros/matching";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
import type { ProProfile } from "@/lib/pros/types";
import { lineDeepLink, phoneToWaMe, cn } from "@/lib/utils";
import {
  getSpeechRecognitionCtor,
  speechLocale,
  speechRecognitionSupported,
  type SpeechRecognitionLike,
} from "@/lib/villas/speech-recognition";
import { useI18n } from "@/lib/i18n/provider";

const FEATURED = ["hvac", "plumbing", "electrical", "pool", "pest", "cleaning", "handyman", "moving"] as const;

function languageName(code: string) {
  if (code in LOCALE_META) return LOCALE_META[code as Locale].native;
  return code;
}

function isVerified(pro: ProProfile) {
  return Boolean(pro.checks.phone || pro.checks.identity || pro.checks.business || pro.checks.email);
}

export function HomeScreen() {
  const { state, ready, t } = usePros();
  const categories = allCategories(state).filter((cat) => cat.active);
  const bySlug = (slug: string) => categories.find((cat) => cat.slug === slug);
  const featured = FEATURED.map((slug) => bySlug(slug)).filter((cat): cat is NonNullable<typeof cat> => Boolean(cat));
  const near = filterPros(state, {
    mode: "public",
    orgId: null,
    placeId: state.placeId,
    available: true,
  });
  return (
    <div className="space-y-6">
      <HomeComposer />
      <CategoryGrid featured={featured} rest={categories} />
      <ProRow
        title={t("availableToday")}
        pros={near}
        ready={ready}
        empty={t("noProsNear")}
      />
    </div>
  );
}

function HomeComposer() {
  const { state, t } = usePros();
  const { locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const to = (path: string) => servicesPath(pathname, path);
  const prompts = [t("composerAircon"), t("composerPool")];
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [prompt, setPrompt] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOk, setVoiceOk] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const rec = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);
  const fieldId = useId();

  useEffect(() => {
    setVoiceOk(speechRecognitionSupported());
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => {
      media.removeEventListener("change", apply);
      rec.current?.abort();
      listeningRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || text.trim()) return;
    const timer = window.setInterval(() => {
      setPrompt((index) => (index + 1) % prompts.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [prompts.length, reduceMotion, text]);

  const stopVoice = () => {
    rec.current?.abort();
    rec.current = null;
    listeningRef.current = false;
    setListening(false);
    setInterim("");
  };

  const toggleVoice = () => {
    if (listeningRef.current) {
      stopVoice();
      return;
    }
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setVoiceOk(false);
      setError(t("voiceUnsupported"));
      return;
    }
    const recg = new Ctor();
    recg.lang = speechLocale(locale as Locale);
    recg.continuous = true;
    recg.interimResults = true;
    recg.onresult = (ev) => {
      let finalText = "";
      let live = "";
      for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
        const chunk = ev.results[i][0]?.transcript ?? "";
        if (ev.results[i].isFinal) finalText += chunk;
        else live += chunk;
      }
      if (finalText.trim()) {
        setText((prev) => `${prev} ${finalText}`.replace(/\s+/g, " ").trim());
        setError(null);
      }
      setInterim(live);
    };
    recg.onerror = () => stopVoice();
    recg.onend = () => {
      listeningRef.current = false;
      setListening(false);
      setInterim("");
    };
    rec.current = recg;
    try {
      recg.start();
      listeningRef.current = true;
      setListening(true);
      setError(null);
    } catch {
      stopVoice();
      setVoiceOk(false);
      setError(t("voiceUnsupported"));
    }
  };

  const shown = listening && interim ? `${text} ${interim}`.trim() : text;

  const find = () => {
    const brief = shown.trim();
    const params = new URLSearchParams();
    if (brief) params.set("q", brief);
    const match = suggestFromBrief(state, brief);
    if (match?.categoryId) params.set("category", match.categoryId);
    const query = params.toString();
    router.push(to(query ? `/find?${query}` : "/find"));
  };

  return (
    <section className="rounded-[calc(var(--radius-card)+0.5rem)] bg-card p-3 lift-shadow ring-1 ring-[color-mix(in_srgb,var(--color-primary)_32%,transparent)]">
      <label htmlFor={fieldId} className="sr-only">
        {t("describeJob")}
      </label>
      <textarea
        id={fieldId}
        value={shown}
        readOnly={listening}
        rows={4}
        placeholder={prompts[prompt]}
        onChange={(event) => {
          setText(event.target.value);
          setError(null);
        }}
        className="min-h-[7.5rem] w-full resize-none bg-transparent px-1 py-1 text-base leading-relaxed text-ink outline-none placeholder:text-muted"
      />
      {photo ? (
        <div className="mt-1 flex items-center gap-2 px-1">
          <img src={photo} alt="" className="size-12 rounded-[var(--radius-control)] object-cover" />
          <button
            type="button"
            className="text-xs font-semibold text-primary"
            onClick={() => setPhoto(null)}
          >
            {t("close")}
          </button>
        </div>
      ) : null}
      {error ? <p className="px-1 pt-1 text-xs text-[var(--color-danger)]">{error}</p> : null}
      <div className="mt-2 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            void readPhoto(file).then((data) => {
              if (!data) {
                setError(t("photoTooBig"));
                return;
              }
              setPhoto(data);
              setError(null);
            });
          }}
        />
        <IconButton label={t("addPhoto")} pressed={Boolean(photo)} onClick={() => fileRef.current?.click()}>
          <Camera className="size-5" strokeWidth={2} aria-hidden />
        </IconButton>
        <IconButton
          label={voiceOk ? t("voiceDescribe") : t("voiceUnsupported")}
          pressed={listening}
          onClick={toggleVoice}
        >
          <Mic className="size-5" strokeWidth={2} aria-hidden />
        </IconButton>
        <button
          type="button"
          onClick={find}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-[var(--radius-pill)] bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-cta)] transition active:scale-[0.98]"
        >
          {t("findAPro")}
        </button>
      </div>
    </section>
  );
}

function IconButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-canvas text-ink transition active:scale-[0.98]",
        pressed && "border-primary text-primary",
      )}
    >
      {children}
    </button>
  );
}

function CategoryGrid({
  featured,
  rest,
}: {
  featured: ReturnType<typeof allCategories>;
  rest: ReturnType<typeof allCategories>;
}) {
  const { t } = usePros();
  const { locale } = useI18n();
  const pathname = usePathname();
  const to = (path: string) => servicesPath(pathname, path);
  const [sheet, setSheet] = useState<null | "all" | "cleaning">(null);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const cleaning = rest.find((cat) => cat.slug === "cleaning");
  const deep = rest.find((cat) => cat.slug === "deep-cleaning");

  useEffect(() => {
    if (!sheet) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheet(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheet]);

  const sheetCats =
    sheet === "cleaning"
      ? []
      : rest.filter((cat) => cat.slug !== "deep-cleaning");

  return (
    <section>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {featured.map((cat) =>
          cat.slug === "cleaning" ? (
            <li key={cat.id}>
              <button
                type="button"
                onClick={() => setSheet("cleaning")}
                className="flex min-h-[5.75rem] w-full flex-col items-start justify-between rounded-[var(--radius-control)] bg-canvas-deep px-3 py-3 text-start transition active:scale-[0.98]"
              >
                <CategoryIcon name={cat.icon} tone="action" className="size-7" />
                <span className="line-clamp-2 text-xs font-semibold leading-tight text-ink">
                  {localizedName(cat.names, locale)}
                </span>
              </button>
            </li>
          ) : (
            <li key={cat.id}>
              <Link
                href={to(`/c/${cat.slug}`)}
                className="flex min-h-[5.75rem] flex-col items-start justify-between rounded-[var(--radius-control)] bg-canvas-deep px-3 py-3 transition active:scale-[0.98]"
              >
                <CategoryIcon name={cat.icon} tone="action" className="size-7" />
                <span className="line-clamp-2 text-xs font-semibold leading-tight text-ink">
                  {localizedName(cat.names, locale)}
                </span>
              </Link>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            onClick={() => setSheet("all")}
            className="flex min-h-[5.75rem] w-full flex-col items-start justify-between rounded-[var(--radius-control)] bg-canvas-deep px-3 py-3 text-start transition active:scale-[0.98]"
          >
            <CategoryIcon name="more" tone="action" className="size-7" />
            <span className="text-xs font-semibold leading-tight text-ink">{t("seeAll")}</span>
          </button>
        </li>
      </ul>

      {sheet ? (
        <div className="fixed inset-0 z-40 flex items-end">
          <button
            type="button"
            aria-label={t("close")}
            className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-ink)_40%,transparent)]"
            onClick={() => setSheet(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative max-h-[min(70dvh,32rem)] w-full overflow-y-auto rounded-t-[calc(var(--radius-card)+0.25rem)] bg-canvas px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[var(--shadow-lift)] motion-safe:animate-rise"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--color-border)]" />
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 id={titleId} className="font-display text-[length:var(--type-subtitle)] font-bold tracking-[-0.02em] text-ink">
                {sheet === "cleaning"
                  ? localizedName(cleaning?.names ?? { en: t("regularCleaning") }, locale)
                  : t("seeAll")}
              </h2>
              <button
                ref={closeRef}
                type="button"
                className="text-sm font-semibold text-primary"
                onClick={() => setSheet(null)}
              >
                {t("close")}
              </button>
            </div>
            <ul className="space-y-1 pb-2">
              {sheet === "cleaning" ? (
                <>
                  {cleaning ? (
                    <SheetLink href={to(`/c/${cleaning.slug}`)} icon={cleaning.icon} label={t("regularCleaning")} />
                  ) : null}
                  {deep ? (
                    <SheetLink href={to(`/c/${deep.slug}`)} icon={deep.icon} label={localizedName(deep.names, locale)} />
                  ) : null}
                </>
              ) : (
                sheetCats.map((cat) =>
                  cat.slug === "cleaning" && deep ? (
                    <li key={cat.id} className="rounded-[var(--radius-control)] bg-canvas-deep">
                      <p className="px-3 pt-3 text-xs font-semibold text-muted">
                        {localizedName(cat.names, locale)}
                      </p>
                      <Link href={to(`/c/${cat.slug}`)} className="flex min-h-11 items-center px-3 text-sm font-semibold text-ink">
                        {t("regularCleaning")}
                      </Link>
                      <Link href={to(`/c/${deep.slug}`)} className="flex min-h-11 items-center px-3 pb-2 text-sm font-semibold text-ink">
                        {localizedName(deep.names, locale)}
                      </Link>
                    </li>
                  ) : (
                    <SheetLink
                      key={cat.id}
                      href={to(`/c/${cat.slug}`)}
                      icon={cat.icon}
                      label={localizedName(cat.names, locale)}
                    />
                  ),
                )
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SheetLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] px-1 text-sm font-semibold text-ink active:bg-canvas-deep"
      >
        <CategoryIcon name={icon} tone="action" className="size-6" />
        {label}
      </Link>
    </li>
  );
}

function ProRow({
  title,
  pros,
  ready,
  empty,
}: {
  title: string;
  pros: ProProfile[];
  ready: boolean;
  empty: string;
}) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-[length:var(--type-subtitle)] font-bold tracking-[-0.02em] text-ink">
        {title}
      </h2>
      {!ready ? (
        <div className="-mx-4 flex gap-3 overflow-hidden px-4">
          <ProSkeleton />
          <ProSkeleton />
        </div>
      ) : pros.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
          {pros.map((pro) => (
            <HomeProCard key={pro.id} pro={pro} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProSkeleton() {
  return (
    <div className="h-40 w-[16.75rem] shrink-0 rounded-[var(--radius-card)] bg-canvas-deep motion-safe:animate-pulse" />
  );
}

function HomeProCard({ pro }: { pro: ProProfile }) {
  const { state, actor, t } = usePros();
  const { locale } = useI18n();
  const pathname = usePathname();
  const onAppPath = pathname === "/pros" || pathname.startsWith("/pros/");
  const profilePath = onAppPath ? `/pros/p/${pro.id}` : `/p/${pro.id}`;
  const start = onAppPath ? "/pros/start" : "/start";
  const guest = !actor;
  const href = guest ? `${start}?next=${encodeURIComponent(profilePath)}` : profilePath;
  const trade = categoryName(state, pro.categoryIds[0] ?? null, locale);
  const languages = pro.languages.map(languageName).slice(0, 3).join(", ");
  const channel = pro.whatsapp ? "whatsapp" : pro.lineId ? "line" : null;
  const contactHref = guest
    ? href
    : channel === "whatsapp" && pro.whatsapp
      ? phoneToWaMe(pro.whatsapp)
      : channel === "line" && pro.lineId
        ? lineDeepLink(pro.lineId)
        : null;

  return (
    <article className="flex w-[16.75rem] shrink-0 snap-start flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-card p-3 soft-shadow">
      <Link href={href} aria-label={guest ? t("signInToSee") : undefined} className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-canvas-deep font-display text-lg text-ink",
            guest && "select-none blur-[2px]",
          )}
          aria-hidden={guest || undefined}
        >
          {pro.photoUrl ? <img src={pro.photoUrl} alt="" className="size-full object-cover" /> : pro.name.slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate font-semibold text-ink", guest && "select-none blur-[2px]")} aria-hidden={guest || undefined}>
            {pro.name}
          </span>
          <span className="block truncate text-sm text-muted">{trade || t("position")}</span>
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-1.5">
        {isVerified(pro) ? (
          <span className="rounded-full bg-[color-mix(in_srgb,var(--color-success)_16%,transparent)] px-2 py-0.5 text-[length:var(--type-meta)] font-semibold text-[var(--color-success)]">
            {t("verifiedShort")}
          </span>
        ) : null}
        {languages ? <span className="text-[length:var(--type-meta)] text-muted">{languages}</span> : null}
      </div>
      {channel && contactHref ? (
        contactHref.startsWith("http") ? (
          <a
            href={contactHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center justify-center self-start rounded-full border border-[var(--color-border)] px-3 text-xs font-semibold text-ink active:scale-[0.98]"
          >
            {channel === "whatsapp" ? t("whatsapp") : t("line")}
          </a>
        ) : (
          <Link
            href={contactHref}
            aria-label={t("signInToContact")}
            className="inline-flex min-h-9 items-center justify-center self-start rounded-full border border-[var(--color-border)] px-3 text-xs font-semibold text-ink active:scale-[0.98]"
          >
            {channel === "whatsapp" ? t("whatsapp") : t("line")}
          </Link>
        )
      ) : null}
    </article>
  );
}
