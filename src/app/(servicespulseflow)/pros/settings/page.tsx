"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppearance } from "@/lib/appearance/provider";
import { serviceInviteCode, serviceInviteUrl } from "@/lib/pros/join";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
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
  const { actor, actorReady, plan, setPlan, t } = usePros();
  const pathname = usePathname();
  const router = useRouter();
  const { appearance, setAppearance } = useAppearance();
  const start = pathname.startsWith("/pros") ? "/pros/start" : "/start";
  const [invite, setInvite] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!actorReady || actor) return;
    router.replace(`${start}?mode=sign-in&next=${encodeURIComponent(servicesPath(pathname, "/settings"))}`);
  }, [actor, actorReady, pathname, router, start]);

  useEffect(() => {
    if (!actor) return;
    setInvite(serviceInviteCode());
    setInviteLink(serviceInviteUrl(window.location.origin));
  }, [actor]);

  if (!actor) return null;

  return (
    <div className="space-y-3">
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("settings")}</h1>

      <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
        <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("theme")}</h2>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={appearance !== "dark"} label={t("themeFrost")} onClick={() => setAppearance("frost")} />
          <Chip active={appearance === "dark"} label={t("themeDark")} onClick={() => setAppearance("dark")} />
        </div>
      </section>

      <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
        <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("inviteCode")}</h2>
        <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{t("inviteHint")}</p>
        <p className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{invite}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            className="min-h-12 w-full"
            onClick={() => {
              const link = serviceInviteUrl(window.location.origin, { as: "pro" });
              setInviteLink(link);
              void navigator.clipboard.writeText(link).then(() => setCopied(true));
            }}
          >
            {copied ? t("copied") : t("copyInvitePro")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-12 w-full"
            onClick={() => {
              const link = serviceInviteUrl(window.location.origin, { as: "seeker" });
              setInviteLink(link);
              void navigator.clipboard.writeText(link).then(() => setCopied(true));
            }}
          >
            {copied ? t("copied") : t("copyInviteSeeker")}
          </Button>
        </div>
        {inviteLink ? <p className="break-all text-pf-12 text-pf-slate-ink">{inviteLink}</p> : null}
      </section>

      <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("planTitle")}</h2>
          {plan.premium || plan.pro ? <span className="text-pf-14 font-medium text-pf-ink">{t("planOn")}</span> : null}
        </div>
        <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{t("premiumBody")}</p>
        {actor ? (
          <Button
            type="button"
            variant={plan.premium || plan.pro ? "ghost" : "primary"}
            className="min-h-12 w-full"
            onClick={() => {
              const on = !(plan.premium || plan.pro);
              setPlan({ premium: on, pro: on });
            }}
          >
            {plan.premium || plan.pro ? t("turnOff") : t("turnOn")}
          </Button>
        ) : null}
      </section>

      <p className="text-pf-12 leading-relaxed text-pf-slate-ink">{t("paymentNotCharged")}</p>
    </div>
  );
}
