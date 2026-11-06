"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { prosT } from "@/lib/pros/i18n";
import { LEGAL_SECTIONS, type LegalAudience } from "@/lib/pros/legal";
import { prosLang } from "@/lib/pros/catalog";
import { SupportMail } from "@/components/pros/support-mail";
import { isMarketplaceHost, MARKETPLACE_ORIGIN } from "@/lib/pros/paths";

export function LegalAccept({
  audience,
  accepted,
  onAccepted,
  emails,
  onEmails,
}: {
  audience: LegalAudience;
  accepted: boolean;
  onAccepted: (next: boolean) => void;
  emails: boolean;
  onEmails: (next: boolean) => void;
}) {
  const { locale } = useI18n();
  const t = (key: Parameters<typeof prosT>[1]) => prosT(locale, key);
  const lang = prosLang(locale);
  const box = useRef<HTMLDivElement>(null);
  const [read, setRead] = useState(false);
  const [origin, setOrigin] = useState("");

  const mark = () => {
    const el = box.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setRead(true);
  };

  useEffect(() => {
    setRead(false);
    onAccepted(false);
    const frame = requestAnimationFrame(() => {
      if (box.current) box.current.scrollTop = 0;
      mark();
    });
    return () => cancelAnimationFrame(frame);
  }, [audience, locale, onAccepted]);

  useEffect(() => {
    const { protocol, hostname, port, host } = window.location;
    if (isMarketplaceHost(host)) {
      setOrigin("");
    } else if (hostname === "localhost" || hostname.endsWith(".localhost")) {
      setOrigin(`${protocol}//services.localhost${port ? `:${port}` : ""}`);
    } else {
      setOrigin(MARKETPLACE_ORIGIN);
    }
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-pf-16 leading-relaxed text-pf-text-secondary">
        {t("legalNote")}{" "}
        <Link href={`${origin}/terms`} className="font-medium text-pf-text-secondary">
          {t("termsLink")}
        </Link>
        {" "}
        <Link href={`${origin}/privacy`} className="font-medium text-pf-text-secondary">
          {t("privacyLink")}
        </Link>
      </p>
      <div
        ref={box}
        onScroll={mark}
        className="max-h-40 overflow-y-auto rounded-[14px] border border-pf-line bg-pf-page p-3 text-pf-16 leading-relaxed text-pf-ink"
      >
        {LEGAL_SECTIONS.filter((section) => section.audience === audience).map((section) => (
          <section key={section.id} className="mb-3">
            <h3 className="text-pf-14 font-medium text-pf-ink">{section.heading[lang]}</h3>
            <p className="mt-1 text-pf-slate-ink">{section.body[lang]}</p>
          </section>
        ))}
        <p className="text-pf-12 font-medium text-pf-ink">{t("legalEnd")}</p>
      </div>
      <label className="flex items-start gap-2 text-pf-16 text-pf-ink">
        <input
          type="checkbox"
          className="mt-1"
          checked={accepted}
          disabled={!read}
          onChange={(e) => onAccepted(e.target.checked)}
        />
        <span>{t("acceptLegal")}</span>
      </label>
      <label className="flex items-start gap-2 text-pf-16 text-pf-ink">
        <input
          type="checkbox"
          className="mt-1"
          checked={emails}
          onChange={(e) => onEmails(e.target.checked)}
        />
        <span>
          {t("emailOptIn")}
          <span className="mt-0.5 block text-pf-12 leading-snug text-pf-slate-ink">{t("emailOptInHint")}</span>
        </span>
      </label>
      <SupportMail locale={locale} />
    </div>
  );
}
