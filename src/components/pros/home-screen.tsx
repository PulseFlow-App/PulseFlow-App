"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { selectionTick } from "@/components/pros/haptics";
import { PfIcon, type PfIconName } from "@/components/pros/pf-icons";
import { readPhoto } from "@/components/pros/parts";
import { PlacePicker } from "@/components/pros/place-picker";
import { LOCALE_META, type Locale } from "@/lib/i18n";
import { localizedName } from "@/lib/pros/catalog";
import { suggestFromBrief } from "@/lib/pros/brief";
import { PROS_EVENT } from "@/lib/pros/jobs";
import {
  allCategories,
  categoryName,
  filterPros,
  responseMinutes,
  sortOrganic,
} from "@/lib/pros/matching";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
import type { ProProfile, ProsState } from "@/lib/pros/types";
import { lineDeepLink, phoneToWaMe, cn } from "@/lib/utils";
import {
  getSpeechRecognitionCtor,
  speechLocale,
  speechRecognitionSupported,
  type SpeechRecognitionLike,
} from "@/lib/villas/speech-recognition";
import { useI18n } from "@/lib/i18n/provider";

const COMPOSER_KEY = "pulseflow.services.composer";
const SLOT = "koh-phangan-tradesperson";

const TILES: { slug: string; tint: "peach" | "yellow" | "white" | "navy"; span: string }[] = [
  { slug: "hvac", tint: "peach", span: "col-span-2 min-h-[7.25rem]" },
  { slug: "plumbing", tint: "yellow", span: "min-h-[7.25rem]" },
  { slug: "electrical", tint: "white", span: "min-h-[6.25rem]" },
  { slug: "pool", tint: "navy", span: "min-h-[6.25rem]" },
  { slug: "pest", tint: "peach", span: "min-h-[6.25rem]" },
  { slug: "cleaning", tint: "yellow", span: "col-span-2 min-h-[6.25rem]" },
  { slug: "handyman", tint: "white", span: "min-h-[6.25rem]" },
  { slug: "moving", tint: "navy", span: "col-span-2 min-h-[6.25rem]" },
];

const TINT: Record<(typeof TILES)[number]["tint"], string> = {
  peach: "bg-pf-peach-100 text-pf-ink",
  yellow: "bg-pf-yellow-300 text-pf-ink",
  white: "bg-pf-card text-pf-ink ring-1 ring-pf-line",
  navy: "bg-pf-navy-900 text-[#F5F7FC]",
};

function languageName(code: string) {
  if (code in LOCALE_META) return LOCALE_META[code as Locale].native;
  return code;
}

function isVerified(pro: ProProfile) {
  return Boolean(pro.checks.phone || pro.checks.identity || pro.checks.business || pro.checks.email);
}

function averageReply(state: ProsState, pro: ProProfile) {
  const offers = state.offers.filter((offer) => offer.profileId === pro.id);
  const minutes = state.requests
    .map((request) => responseMinutes(request, offers))
    .filter((value): value is number => value != null);
  if (!minutes.length) return null;
  return Math.round(minutes.reduce((sum, value) => sum + value, 0) / minutes.length);
}

function openWithTransition(push: (href: string) => void, href: string) {
  selectionTick();
  const go = () => push(href);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || typeof document.startViewTransition !== "function") {
    go();
    return;
  }
  document.startViewTransition(() => {
    go();
  });
}

export function HomeScreen() {
  const { state, ready, t } = usePros();
  const categories = allCategories(state).filter((cat) => cat.active);
  const bySlug = (slug: string) => categories.find((cat) => cat.slug === slug);
  const featured = TILES.map((tile) => {
    const cat = bySlug(tile.slug);
    return cat ? { ...tile, cat } : null;
  }).filter((tile): tile is NonNullable<typeof tile> => Boolean(tile));
  const near = sortOrganic(
    filterPros(state, { mode: "public", orgId: null, placeId: state.placeId, available: true }),
    state.reviews,
  );

  return (
    <div className="bg-pf-page font-[family-name:var(--font-pf-sans)] text-pf-ink">
      <HomeBar />
      <div className="space-y-6 px-4 pb-4">
        <HomeComposer />
        <CategoryGrid featured={featured} rest={categories} />
        <ProRow title={t("availableToday")} pros={near} ready={ready} empty={t("noProsNear")} />
      </div>
    </div>
  );
}

function HomeBar() {
  const { actor, t } = usePros();
  const pathname = usePathname();
  const to = (path: string) => servicesPath(pathname, path);
  const pullRef = useRef(0);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const onDown = (event: PointerEvent) => {
      if (main.scrollTop > 2) return;
      startY.current = event.clientY;
    };
    const onMove = (event: PointerEvent) => {
      if (startY.current == null || main.scrollTop > 2) return;
      pullRef.current = Math.max(0, Math.min(72, event.clientY - startY.current));
    };
    const onUp = () => {
      if (startY.current == null) return;
      startY.current = null;
      const pulled = pullRef.current;
      pullRef.current = 0;
      if (pulled <= 56) return;
      selectionTick();
      window.dispatchEvent(new Event("pros-refresh"));
      window.dispatchEvent(new Event(PROS_EVENT));
    };
    main.addEventListener("pointerdown", onDown);
    main.addEventListener("pointermove", onMove);
    main.addEventListener("pointerup", onUp);
    main.addEventListener("pointercancel", onUp);
    return () => {
      main.removeEventListener("pointerdown", onDown);
      main.removeEventListener("pointermove", onMove);
      main.removeEventListener("pointerup", onUp);
      main.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const account = actor ? to("/settings") : `${to("/start")}?mode=sign-in&next=/`;

  return (
    <div className="sticky top-0 z-10 bg-pf-page px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2 pb-2">
        <PlacePicker variant="pill" />
        <div className="min-w-0 flex-1" />
        <LanguageSwitcher variant="code" />
        <Link
          href={account}
          aria-label={actor ? t("settings") : t("signIn")}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-pf-navy-900 text-[15px] font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600"
        >
          {actor ? actor.name.slice(0, 1) : <PfIcon name="person" tone="onNavy" className="size-5" />}
        </Link>
      </div>
      <h1 className="pb-2 text-[28px] font-bold tracking-[-0.02em] text-pf-ink">
        {t("homeTitle")}
      </h1>
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
  const [pressed, setPressed] = useState(false);
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
    selectionTick();
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
    selectionTick();
    const brief = shown.trim();
    try {
      sessionStorage.setItem(COMPOSER_KEY, JSON.stringify({ text: brief, photo }));
    } catch {
      /* the photo stays on this screen if storage is full */
    }
    const params = new URLSearchParams();
    if (brief) params.set("q", brief);
    const match = suggestFromBrief(state, brief);
    if (match?.categoryId) params.set("category", match.categoryId);
    const query = params.toString();
    openWithTransition(router.push, to(query ? `/find?${query}` : "/find"));
  };

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-pf-panel p-4 text-pf-on-panel shadow-pf-2">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pf-orange-500 to-pf-orange-700" />
      <label htmlFor={fieldId} className="sr-only">
        {t("describeJob")}
      </label>
      <textarea
        id={fieldId}
        value={shown}
        readOnly={listening}
        rows={5}
        placeholder={prompts[prompt]}
        onChange={(event) => {
          setText(event.target.value);
          setError(null);
        }}
        className="min-h-[8.5rem] w-full resize-none bg-transparent py-2 text-pf-16 leading-relaxed text-pf-on-panel outline-none placeholder:text-pf-slate-400"
      />
      {photo ? (
        <div className="mb-3 flex items-center gap-2">
          <img src={photo} alt="" className="size-14 rounded-[14px] object-cover" />
          <button type="button" className="min-h-11 px-2 text-pf-14 font-medium text-[#C9D0E3]" onClick={() => setPhoto(null)}>
            {t("close")}
          </button>
        </div>
      ) : null}
      {error ? <p className="pb-2 text-pf-14 text-pf-danger-ink">{error}</p> : null}
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            selectionTick();
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
        <RoundTool label={t("addPhoto")} pressed={Boolean(photo)} onClick={() => fileRef.current?.click()}>
          <PfIcon name="camera" tone="onNavy" className="size-5" />
        </RoundTool>
        <RoundTool
          label={voiceOk ? t("voiceDescribe") : t("voiceUnsupported")}
          pressed={listening}
          onClick={toggleVoice}
        >
          <PfIcon name="mic" tone="onNavy" className="size-5" />
        </RoundTool>
        <button
          type="button"
          onClick={find}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          className={cn(
            "inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-center text-pf-16 font-medium text-white",
            pressed ? "bg-pf-orange-700" : "bg-pf-orange-500",
          )}
        >
          {t("findAPro")}
        </button>
      </div>
    </section>
  );
}

function RoundTool({
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
        "inline-flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-white/10 text-white",
        pressed && "bg-white/20",
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
  featured: { slug: string; tint: "peach" | "yellow" | "white" | "navy"; span: string; cat: ReturnType<typeof allCategories>[number] }[];
  rest: ReturnType<typeof allCategories>;
}) {
  const { t } = usePros();
  const { locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const to = (path: string) => servicesPath(pathname, path);
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (href: string) => openWithTransition(router.push, href);

  return (
    <section>
      <ul className="grid grid-cols-3 gap-2">
        {featured.map((tile) => (
          <li key={tile.cat.id} className={tile.span}>
            <Link
              href={to(`/c/${tile.cat.slug}`)}
              onClick={(event) => {
                event.preventDefault();
                go(to(`/c/${tile.cat.slug}`));
              }}
              style={{ viewTransitionName: `pf-cat-${tile.cat.slug}` }}
              className={cn(
                "flex h-full w-full flex-col items-start justify-between rounded-[20px] px-3 py-3 text-start active:scale-[0.98]",
                TINT[tile.tint],
              )}
            >
              <PfIcon
                name={(tile.cat.icon as PfIconName) || "more"}
                tone={tile.tint === "navy" ? "onNavy" : "default"}
                className="size-7"
              />
              <span className="text-pf-14 font-medium leading-tight">{localizedName(tile.cat.names, locale)}</span>
            </Link>
          </li>
        ))}
        <li className="min-h-[6.25rem]">
          <button
            type="button"
            onClick={() => {
              selectionTick();
              setOpen(true);
            }}
            className="flex h-full w-full flex-col items-start justify-between rounded-[20px] bg-pf-card px-3 py-3 text-start text-pf-ink ring-1 ring-pf-line active:scale-[0.98]"
          >
            <PfIcon name="more" className="size-7" />
            <span className="text-pf-14 font-medium leading-tight">{t("seeAll")}</span>
          </button>
        </li>
      </ul>

      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button type="button" aria-label={t("close")} className="absolute inset-0 bg-pf-navy-900/40" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative max-h-[min(70dvh,32rem)] w-full max-w-sm overflow-y-auto rounded-[28px] bg-pf-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-pf-2 motion-safe:animate-rise"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 id={titleId} className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">
                {t("seeAll")}
              </h2>
              <button ref={closeRef} type="button" className="min-h-11 px-2 text-pf-14 font-medium text-pf-text-secondary" onClick={() => setOpen(false)}>
                {t("close")}
              </button>
            </div>
            <ul className="pb-2">
              {rest.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={to(`/c/${cat.slug}`)}
                    onClick={(event) => {
                      event.preventDefault();
                      go(to(`/c/${cat.slug}`));
                    }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-[14px] px-1 text-start text-pf-16 font-medium text-pf-ink active:bg-pf-page"
                  >
                    <PfIcon name={(cat.icon as PfIconName) || "more"} className="size-6" />
                    {localizedName(cat.names, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
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
      <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{title}</h2>
      {!ready ? (
        <div className="@container -mx-4 flex gap-3 overflow-hidden px-4">
          <div className="h-44 w-[calc((100cqw-0.75rem)/2)] shrink-0 rounded-[20px] bg-pf-card ring-1 ring-pf-line" />
          <div className="h-44 w-[calc((100cqw-0.75rem)/2)] shrink-0 rounded-[20px] bg-pf-card ring-1 ring-pf-line" />
        </div>
      ) : pros.length === 0 ? (
        <p className="max-w-[70ch] text-pf-16 text-pf-text-secondary">{empty}</p>
      ) : (
        <div className="@container -mx-4 flex snap-x snap-proximity scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 [touch-action:pan-x_pan-y]">
          {pros.map((pro) => (
            <HomeProCard key={`${title}-${pro.id}`} pro={pro} />
          ))}
        </div>
      )}
    </section>
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
  const minutes = averageReply(state, pro);
  const channels = [
    pro.whatsapp ? { key: "whatsapp" as const, href: phoneToWaMe(pro.whatsapp), label: t("whatsapp") } : null,
    pro.lineId ? { key: "line" as const, href: lineDeepLink(pro.lineId), label: t("line") } : null,
  ].filter((row): row is NonNullable<typeof row> => Boolean(row));

  return (
    <article className="flex w-[calc((100cqw-0.75rem)/2)] shrink-0 snap-start flex-col gap-3 overflow-hidden rounded-[20px] border border-pf-line bg-pf-card p-3">
      <div className={cn("flex min-w-0 flex-col gap-3", guest && "select-none blur-[6px]")}>
      <Link href={href} className="flex min-w-0 items-center gap-3">
        <TradeSlot name={pro.name} photo={pro.photoUrl} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-pf-16 font-medium text-pf-ink">{pro.name}</span>
          <span className="block truncate text-pf-14 text-pf-text-secondary">{trade || t("position")}</span>
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-1.5">
        {isVerified(pro) ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-pf-peach-100 px-2 py-0.5 text-pf-12 font-medium text-pf-success-ink">
            <PfIcon name="check" className="size-3" />
            {t("verifiedShort")}
          </span>
        ) : null}
        {minutes != null ? (
          <span className="text-pf-12 font-medium text-pf-slate-ink">{t("minutes", { count: minutes })}</span>
        ) : null}
        {pro.languages.map((code) => (
          <span key={code} className="rounded-full bg-pf-peach-100 px-2 py-0.5 text-pf-12 font-medium text-pf-ink">
            {languageName(code)}
          </span>
        ))}
      </div>
      {channels.length ? (
        <div className="flex flex-wrap gap-2">
          {channels.map((channel) =>
            guest ? (
              <Link
                key={channel.key}
                href={href}
                aria-label={t("signInToContact")}
                className="inline-flex min-h-11 items-center rounded-full bg-pf-card px-3 text-pf-14 font-medium text-pf-ink ring-1 ring-pf-line"
              >
                {channel.label}
              </Link>
            ) : (
              <a
                key={channel.key}
                href={channel.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-full bg-pf-card px-3 text-pf-14 font-medium text-pf-ink ring-1 ring-pf-line"
              >
                {channel.label}
              </a>
            ),
          )}
        </div>
      ) : null}
      </div>
    </article>
  );
}

function TradeSlot({ name, photo }: { name: string; photo: string | null }) {
  if (photo) {
    return <img src={photo} alt="" className="size-14 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span
      role="img"
      aria-label={SLOT}
      className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-pf-peach-100 font-[family-name:var(--font-pf-sans)] text-pf-18 font-medium text-pf-ink"
    >
      {name.slice(0, 1)}
    </span>
  );
}
