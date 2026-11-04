"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { prosT } from "@/lib/pros/i18n";
import { marketplaceOriginForHost } from "@/lib/pros/paths";

type Gig = {
  id: string;
  title: string;
  description: string;
  when: string | null;
  replied: boolean;
};

/** Marketplace work for this person, shown in Pulse Flow only after the accounts are merged. */
export function PersonalGigs() {
  const { locale } = useI18n();
  const [gigs, setGigs] = useState<Gig[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void fetch("/api/services/gigs", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : { gigs: [] }))
        .then((payload: { gigs?: Gig[] }) => {
          if (!cancelled) setGigs(payload.gigs ?? []);
        })
        .catch(() => {
          if (!cancelled) setGigs([]);
        });
    };
    load();
    window.addEventListener("account-link", load);
    return () => {
      cancelled = true;
      window.removeEventListener("account-link", load);
    };
  }, []);

  if (!gigs.length) return null;
  const inbox =
    typeof window === "undefined"
      ? "https://services.pulseflow.site/inbox"
      : `${marketplaceOriginForHost(window.location.host, window.location.protocol)}/inbox`;

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-pf-16 font-bold text-pf-ink">{prosT(locale, "personalGigs")}</h2>
        <p className="text-pf-14 text-pf-text-secondary">{prosT(locale, "personalGigHint")}</p>
      </div>
      <ul className="space-y-2">
        {gigs.map((gig) => (
          <li key={gig.id} className="rounded-[20px] border border-pf-line bg-pf-card p-4">
            <p className="font-bold text-pf-ink">{gig.title}</p>
            {gig.when ? <p className="mt-1 text-pf-14 text-pf-text-secondary">{gig.when}</p> : null}
            {gig.description ? (
              <p className="mt-1 line-clamp-2 text-pf-14 text-pf-text-secondary">{gig.description}</p>
            ) : null}
            <a href={inbox} className="mt-2 inline-flex min-h-11 items-center text-pf-14 font-medium text-pf-ink underline">
              {prosT(locale, "openInServices")}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
