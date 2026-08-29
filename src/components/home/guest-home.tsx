"use client";

import { BedDouble, MessageCircle, Receipt, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

export function GuestHome({ name }: { name: string }) {
  const { t } = useI18n();
  const first = name.split(" ")[0] || name;

  return (
    <div className="space-y-4 animate-rise">
      <div>
        <p className="text-sm text-muted">{t("guest.homeSubtitle")}</p>
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("guest.homeTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted">Hi {first}</p>
      </div>

      <Card className="space-y-3 bg-gradient-to-br from-primary to-primary-dark p-5 text-white">
        <p className="font-display text-lg font-bold">{t("guest.comingSoon")}</p>
        <p className="text-sm text-white/90">{t("guest.comingSoonHint")}</p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="space-y-2 p-4">
          <Building2 className="size-5 text-primary" />
          <p className="text-sm font-semibold text-ink">{t("guest.nav.villas")}</p>
        </Card>
        <Card className="space-y-2 p-4">
          <MessageCircle className="size-5 text-secondary" />
          <p className="text-sm font-semibold text-ink">{t("guest.nav.support")}</p>
        </Card>
        <Card className="space-y-2 p-4">
          <Receipt className="size-5 text-warning-dark" />
          <p className="text-sm font-semibold text-ink">{t("guest.nav.bills")}</p>
        </Card>
        <Card className="space-y-2 p-4">
          <BedDouble className="size-5 text-primary" />
          <p className="text-sm font-semibold text-ink">{t("guest.nav.stay")}</p>
        </Card>
      </div>
    </div>
  );
}
