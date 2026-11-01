"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";

export default function ServicesSettingsPage() {
  const { actor, actorReady, plan, setPlan, t } = usePros();
  const pathname = usePathname();
  const start = pathname.startsWith("/pros") ? "/pros/start" : "/start";

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-ink">{t("settings")}</h1>
      <p className="text-sm leading-relaxed text-muted">{t("trialBody")}</p>

      <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Premium</h2>
          {plan.premium ? <span className="text-sm font-semibold text-ink">{t("planOn")}</span> : null}
        </div>
        <p className="text-sm leading-relaxed text-muted">{t("premiumBody")}</p>
        {actor ? (
          <Button
            type="button"
            variant={plan.premium ? "ghost" : "primary"}
            className="min-h-12 w-full"
            onClick={() => setPlan({ premium: !plan.premium, pro: plan.premium ? false : plan.pro })}
          >
            {plan.premium ? t("turnOff") : t("turnOn")}
          </Button>
        ) : null}
      </section>

      <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Pro</h2>
          {plan.pro ? <span className="text-sm font-semibold text-ink">{t("planOn")}</span> : null}
        </div>
        <p className="text-sm leading-relaxed text-muted">{t("proBody")}</p>
        {actor ? (
          <Button
            type="button"
            variant={plan.pro ? "ghost" : "primary"}
            className="min-h-12 w-full"
            onClick={() => setPlan({ premium: plan.pro ? plan.premium : true, pro: !plan.pro })}
          >
            {plan.pro ? t("turnOff") : t("turnOn")}
          </Button>
        ) : null}
      </section>

      <p className="text-xs leading-relaxed text-muted">{t("paymentNotCharged")}</p>

      {actorReady && !actor ? (
        <div className="space-y-3">
          <p className="text-sm text-ink">{t("settingsNeedAccount")}</p>
          <Link
            href={`${start}?next=${encodeURIComponent(servicesPath(pathname, "/settings"))}`}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-pill)] bg-primary px-4 text-sm font-semibold text-white"
          >
            {t("createServicesAccount")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
