"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useData } from "@/lib/data/use-app-data";
import { translateContentHintKey } from "@/lib/settings/audience-copy";
import { useTranslateContentSettings } from "@/lib/translate/use-localized-content";

/** Translate team content stays on for everyone (no off toggle). */
export function TranslateContentSettingsCard() {
  const { t } = useI18n();
  const data = useData();
  const { enabled, setEnabled } = useTranslateContentSettings();
  const hintKey = translateContentHintKey(data.profile?.role ?? "staff");

  useEffect(() => {
    if (!enabled) setEnabled(true);
  }, [enabled, setEnabled]);

  return (
    <div className="space-y-1.5">
      <div>
        <p className="font-display text-base font-bold text-ink">
          {t("settings.translateContent")}
        </p>
        <p className="text-sm text-ink/70">{t(hintKey)}</p>
      </div>
      <p className="rounded-xl bg-sky-soft/40 px-3 py-2 text-sm font-semibold text-ink">
        {t("common.on")} · {t("settings.translateContentAlwaysOn")}
      </p>
    </div>
  );
}
