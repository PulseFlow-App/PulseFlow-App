"use client";

import { ExternalLink, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { normalizeLocationUrl } from "@/lib/utils";

export function GuestVillaLocation({
  area,
  locationUrl,
}: {
  area: string | null;
  locationUrl: string | null;
}) {
  const { t } = useI18n();
  const href = locationUrl?.trim()
    ? normalizeLocationUrl(locationUrl)
    : null;

  if (!area && !href) return null;

  return (
    <div className="space-y-1">
      {area ? (
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-3.5 shrink-0" />
          {area}
        </p>
      ) : null}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary"
        >
          {t("guest.openLocation")}
          <ExternalLink className="size-3.5 shrink-0" />
        </a>
      ) : null}
    </div>
  );
}
