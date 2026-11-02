"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProCard } from "@/components/pros/parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { briefTitle, suggestFromBrief } from "@/lib/pros/brief";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
import {
  canUseAssistant,
  readServicesCustomer,
  SERVICES_CUSTOMER_EVENT,
} from "@/lib/pros/trial";
import {
  getSpeechRecognitionCtor,
  speechLocale,
  speechRecognitionSupported,
  type SpeechRecognitionLike,
} from "@/lib/villas/speech-recognition";
import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n";

export function NeedBrief({ embedded = false }: { embedded?: boolean }) {
  const { state, actor, actorReady, plan, t } = usePros();
  const { locale } = useI18n();
  const pathname = usePathname();
  const to = (path: string) => servicesPath(pathname, path);
  const start = pathname.startsWith("/pros") ? "/pros/start" : "/start";
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [asked, setAsked] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [payOffered, setPayOffered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);

  const stopVoice = () => {
    rec.current?.abort();
    rec.current = null;
    listeningRef.current = false;
    setListening(false);
    setInterim("");
  };

  useEffect(() => {
    setSupported(speechRecognitionSupported());
    const read = () => {
      const customer = readServicesCustomer();
      const allowed = canUseAssistant(customer, plan);
      setLocked(Boolean(actorReady && !allowed));
    };
    read();
    window.addEventListener(SERVICES_CUSTOMER_EVENT, read);
    return () => {
      window.removeEventListener(SERVICES_CUSTOMER_EVENT, read);
      rec.current?.abort();
      listeningRef.current = false;
    };
  }, [actor, actorReady, plan]);

  const match = useMemo(
    () => (text.trim().length >= 12 ? suggestFromBrief(state, text) : null),
    [state, text],
  );

  const requestHref = (withProfile: boolean) => {
    const params = new URLSearchParams();
    params.set("brief", text.trim());
    params.set("title", briefTitle(text));
    if (match) params.set("category", match.categoryId);
    if (withProfile && match?.profile) params.set("profile", match.profile.id);
    return to(`/request?${params.toString()}`);
  };

  const ask = () => {
    setError(null);
    setConfirmed(false);
    if (text.trim().length < 12) {
      setAsked(false);
      setError(t("tooShort"));
      return;
    }
    setAsked(true);
  };

  const toggleVoice = () => {
    if (listeningRef.current) {
      stopVoice();
      return;
    }
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
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
        setAsked(false);
        setConfirmed(false);
      }
      setInterim(live);
    };
    recg.onerror = () => {
      listeningRef.current = false;
      setListening(false);
      setInterim("");
    };
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
    } catch {
      stopVoice();
      setSupported(false);
    }
  };

  return (
    <section className="space-y-2">
      {embedded ? null : (
        <label htmlFor="need-brief" className="text-pf-14 font-medium text-pf-ink">
          {t("searchPlaceholder")}
        </label>
      )}
      <p id="need-hint" className="text-pf-14 text-pf-text-secondary">
        {t("searchHint")}
      </p>
      <div
        className={
          locked
            ? "pointer-events-none select-none space-y-2 blur-[4px]"
            : "space-y-2"
        }
        aria-hidden={locked || undefined}
      >
        <Input
          id="need-brief"
          value={listening && interim ? `${text} ${interim}`.trim() : text}
          onChange={(e) => {
            setText(e.target.value);
            setAsked(false);
            setConfirmed(false);
            setError(null);
          }}
          readOnly={listening || locked}
          tabIndex={locked ? -1 : 0}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          aria-describedby="need-hint"
          className="min-h-12 text-base"
        />
        <Button
          type="button"
          variant="secondary"
          className="min-h-12 w-full"
          aria-pressed={listening}
          tabIndex={locked ? -1 : 0}
          onClick={toggleVoice}
        >
          {listening ? t("voiceStop") : t("voiceDescribe")}
        </Button>
        {locked ? null : (
          <p className="text-pf-12 text-pf-slate-ink" aria-live="polite">
            {listening ? t("voiceListening") : supported ? "" : t("voiceUnsupported")}
          </p>
        )}
        {error && !locked ? <p className="text-pf-14 font-medium text-pf-danger-ink">{error}</p> : null}
        <Button
          type="button"
          className="min-h-12 w-full"
          reflectGlobalBusy={false}
          tabIndex={locked ? -1 : 0}
          onClick={ask}
        >
          {t("askAssistant")}
        </Button>
      </div>
      {locked ? (
        <div className="space-y-2">
          {actor ? (
            <>
              <Button
                type="button"
                className="min-h-12 w-full"
                reflectGlobalBusy={false}
                onClick={() => setPayOffered(true)}
              >
                {t("payPro")}
              </Button>
              {payOffered ? <p className="text-pf-12 leading-relaxed text-pf-slate-ink">{t("payLater")}</p> : null}
            </>
          ) : (
            <>
              <p className="text-pf-12 leading-relaxed text-pf-slate-ink">{t("agentPriceNote")}</p>
              <Link
                href={`${start}?next=${encodeURIComponent(pathname)}`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-pf-orange-500 px-4 text-pf-16 font-medium text-white active:bg-pf-orange-700"
              >
                {t("signUp")}
              </Link>
              <Link
                href={`${start}?mode=sign-in&next=${encodeURIComponent(pathname)}`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink"
              >
                {t("signIn")}
              </Link>
            </>
          )}
        </div>
      ) : null}
      {asked && !locked && !match ? <p className="text-pf-14 text-pf-text-secondary">{t("noTrade")}</p> : null}
      {asked && !locked && match && !match.profile ? <p className="text-pf-14 text-pf-text-secondary">{t("noPros")}</p> : null}
      {asked && !locked && match?.profile ? (
        <div className="space-y-3">
          <p className="text-pf-16 text-pf-ink">{t("agentIntro")}</p>
          <ProCard pro={match.profile} reveal />
          {confirmed ? (
            <>
              <p className="text-pf-14 text-pf-text-secondary">{t("youSend")}</p>
              <Link
                href={requestHref(true)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-pf-orange-500 px-4 text-pf-16 font-medium text-white active:bg-pf-orange-700"
              >
                {t("sendRequest")}
              </Link>
            </>
          ) : (
            <Button type="button" variant="secondary" className="min-h-12 w-full" reflectGlobalBusy={false} onClick={() => setConfirmed(true)}>
              {t("confirmSpecialist")}
            </Button>
          )}
        </div>
      ) : null}
    </section>
  );
}
