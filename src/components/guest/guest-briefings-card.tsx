"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import { LocalizedText } from "@/components/i18n/localized-text";

export function GuestBriefingsCard({ stayId }: { stayId: string }) {
  const data = useData();
  const { t } = useI18n();
  const briefings = data.guestBriefings.filter((b) => b.stay_id === stayId);

  if (!briefings.length) return null;

  return (
    <Card className="space-y-3 p-4">
      <div>
        <p className="font-display text-base font-bold text-ink">
          {t("guest.briefingsTitle")}
        </p>
        <p className="text-xs text-muted">{t("guest.briefingsHint")}</p>
      </div>
      {briefings.map((b) => (
        <div
          key={b.id}
          className="rounded-2xl bg-[#F7F5F1] p-3 text-sm text-ink"
        >
          <p className="font-bold">
            <LocalizedText text={b.title} />
          </p>
          <LocalizedText text={b.body} as="p" className="mt-1" multiline />
          {b.confirmed_at ? (
            <p className="mt-2 text-xs font-bold text-secondary">
              {t("guest.confirmedRead")}
            </p>
          ) : (
            <Button
              type="button"
              size="sm"
              className="mt-2"
              onClick={() => void data.confirmGuestBriefing(b.id)}
            >
              {t("guest.confirmRead")}
            </Button>
          )}
        </div>
      ))}
    </Card>
  );
}
