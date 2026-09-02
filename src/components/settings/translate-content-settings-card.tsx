"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useData } from "@/lib/data/use-app-data";
import { translateContentHintKey } from "@/lib/settings/audience-copy";
import { useTranslateContentSettings } from "@/lib/translate/use-localized-content";
import { Label } from "@/components/ui/input";

export function TranslateContentSettingsCard() {
  const { t } = useI18n();
  const data = useData();
  const { enabled, setEnabled } = useTranslateContentSettings();
  const hintKey = translateContentHintKey(data.profile?.role ?? "staff");

  return (
    <div className="space-y-2">
      <div>
        <p className="font-display text-base font-bold text-ink">
          {t("settings.translateContent")}
        </p>
        <p className="text-sm text-muted">{t(hintKey)}</p>
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-[#F7F5F1] px-4 py-3">
        <span className="text-sm font-medium text-ink">
          {enabled ? t("common.on") : t("common.off")}
        </span>
        <input
          type="checkbox"
          className="size-5 accent-primary"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          aria-labelledby="translate-content-label"
        />
      </label>
      <Label id="translate-content-label" className="sr-only">
        {t("settings.translateContent")}
      </Label>
    </div>
  );
}
