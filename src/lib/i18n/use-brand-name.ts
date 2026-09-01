"use client";

import { useI18n } from "@/lib/i18n/provider";

/** Localized product name. Latin script for most locales; native script for he/th/my. */
export function useBrandName(): string {
  const { t } = useI18n();
  return t("brand.name");
}
