"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppearance } from "@/lib/appearance/provider";
import { demoLogout } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/env";
import { DirectoryListingCard } from "@/components/pros/directory-listing";
import { ServicesPushToggle } from "@/components/pros/services-push";
import { LinkOffer } from "@/components/account/link-offer";
import { isHireAccount, isWorkAccount } from "@/lib/pros/intent";
import { serviceInviteUrl } from "@/lib/pros/join";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
import { SERVICES_CUSTOMER_EVENT, SERVICES_CUSTOMER_KEY } from "@/lib/pros/trial";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full px-3 text-pf-14 font-medium",
        active ? "bg-pf-peach-100 text-pf-ink" : "border border-pf-line bg-pf-card text-pf-ink",
      )}
    >
      {label}
    </button>
  );
}

export default function ServicesSettingsPage() {
  const { actor, actorReady, plan, t } = usePros();
  const pathname = usePathname();
  const router = useRouter();
  const { appearance, setAppearance } = useAppearance();
  const start = pathname.startsWith("/pros") ? "/pros/start" : "/start";
  const [invite, setInvite] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [joined, setJoined] = useState(0);
  const [goal, setGoal] = useState(5);
  const [discount, setDiscount] = useState(false);

  useEffect(() => {
    if (!actorReady || actor) return;
    router.replace(`${start}?mode=sign-in&next=${encodeURIComponent(servicesPath(pathname, "/settings"))}`);
  }, [actor, actorReady, pathname, router, start]);

  useEffect(() => {
    if (!actor || actor.role === "guest") return;
    let cancelled = false;
    void fetch("/api/services/referral", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { code?: string; count?: number; goal?: number; discount?: boolean } | null) => {
        if (cancelled || !body?.code) return;
        setInvite(body.code);
        setJoined(body.count ?? 0);
        setGoal(body.goal ?? 5);
        setDiscount(Boolean(body.discount));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [actor]);

  if (!actorReady || !actor || actor.role === "guest") return null;
  const work = isWorkAccount(actor);
  const hire = isHireAccount(actor);

  return (
    <div className="space-y-3">
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("settings")}</h1>

      {work ? <DirectoryListingCard /> : null}

      <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
        <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("theme")}</h2>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={appearance !== "dark"} label={t("themeFrost")} onClick={() => setAppearance("frost")} />
          <Chip active={appearance === "dark"} label={t("themeDark")} onClick={() => setAppearance("dark")} />
        </div>
      </section>

      <ServicesPushToggle />

      {work || actor.role === "owner" ? null : <DirectoryListingCard />}
      <LinkOffer app="services" variant="settings" />

      <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
        <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{work ? t("invitePeople") : t("inviteCode")}</h2>
        <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{work ? t("invitePeopleHint") : t("inviteHint")}</p>
        {work ? null : (
          <>
            <p className="text-pf-16 leading-relaxed text-pf-ink">
              {discount
                ? t("referralUnlocked")
                : t("referralProgress", { count: joined, goal })}
            </p>
            {!discount && goal > joined ? (
              <p className="text-pf-16 leading-relaxed text-pf-text-secondary">
                {t("referralRemaining", { remaining: goal - joined })}
              </p>
            ) : null}
            {invite ? <p className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{invite}</p> : null}
          </>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            className="min-h-12 w-full"
            disabled={!invite}
            onClick={() => {
              const link = serviceInviteUrl(window.location.origin, invite, { as: "pro" });
              if (!link) return;
              setInviteLink(link);
              void navigator.clipboard.writeText(link).then(() => setCopied(true)).catch(() => undefined);
            }}
          >
            {copied ? t("copied") : t("copyInvitePro")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-12 w-full"
            disabled={!invite}
            onClick={() => {
              const link = serviceInviteUrl(window.location.origin, invite, { as: "seeker" });
              if (!link) return;
              setInviteLink(link);
              void navigator.clipboard.writeText(link).then(() => setCopied(true)).catch(() => undefined);
            }}
          >
            {copied ? t("copied") : t("copyInviteSeeker")}
          </Button>
        </div>
        {inviteLink ? <p className="break-all text-pf-12 text-pf-slate-ink">{inviteLink}</p> : null}
      </section>

      {hire ? (
        <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("planTitle")}</h2>
            {plan.premium || plan.pro ? <span className="text-pf-14 font-medium text-pf-ink">{t("planOn")}</span> : null}
          </div>
          <p className="text-pf-16 leading-relaxed text-pf-text-secondary">
            {t("planTrialBody")}{" "}
            <Link href={servicesPath(pathname, "/assistant")} className="font-medium text-pf-ink underline">
              {t("readMore")}
            </Link>
          </p>
          <button
            type="button"
            disabled
            className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-full bg-pf-orange-500 px-4 text-pf-16 font-medium text-white opacity-60"
          >
            {t("planUpgrade")}
          </button>
          <p className="text-pf-14 leading-relaxed text-pf-text-secondary">{t("planBillingLater")}</p>
        </section>
      ) : null}

      <button
        type="button"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-pf-danger-ink px-4 text-pf-16 font-medium text-pf-danger-ink"
        onClick={() => {
          void (async () => {
            if (isDemoMode()) {
              demoLogout();
            } else {
              await createClient().auth.signOut();
            }
            localStorage.removeItem(SERVICES_CUSTOMER_KEY);
            window.dispatchEvent(new Event(SERVICES_CUSTOMER_EVENT));
            router.replace("/");
            router.refresh();
          })();
        }}
      >
        {t("signOut")}
      </button>
    </div>
  );
}
