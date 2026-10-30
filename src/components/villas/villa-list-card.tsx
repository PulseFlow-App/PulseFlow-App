"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { PulseIcon } from "@/components/icons/pulse-icon";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { VillaPhoto } from "@/components/villas/villa-photo";
import { VillaFacts } from "@/components/villas/villa-facts";
import { LocalizedText } from "@/components/i18n/localized-text";
import { useI18n } from "@/lib/i18n/provider";
import { formatShortDate, normalizeLocationUrl, cn } from "@/lib/utils";
import type { VillaListItem } from "@/lib/types";

export function VillaListCard({
  villa,
  showAssignees,
  assignees,
  canEdit = false,
}: {
  villa: VillaListItem;
  showAssignees: boolean;
  assignees: string[];
  canEdit?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const hasExtra =
    Boolean(villa.description?.trim()) ||
    Boolean(villa.location_url) ||
    villaFactCount(villa) > 0;

  return (
    <Card className="overflow-hidden p-0 transition hover:bg-canvas-deep/40">
      <div className="relative flex gap-3 p-3 pt-3.5">
        <div className="flex w-[4.5rem] shrink-0 flex-col gap-1.5 sm:w-24">
          <Link
            href={`/villas/${villa.id}/stats`}
            className="relative aspect-square overflow-hidden rounded-xl bg-canvas-deep"
            aria-label={villa.name}
          >
            {villa.photo_url ? (
              <VillaPhoto
                src={villa.photo_url}
                alt=""
                className="size-full rounded-none"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-[11px] font-semibold text-muted">
                {t("villas.photo")}
              </span>
            )}
          </Link>
          <StatusPill
            status={villa.status}
            className="w-full justify-center px-1.5 py-0.5 text-[10px] leading-tight"
          />
        </div>

        <div className="min-w-0 flex-1 pr-9">
          <h3 className="font-display text-base font-bold leading-snug text-ink">
            {villa.name}
          </h3>
          {villa.area ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
              <PulseIcon name="map" className="size-3" />
              {villa.area}
            </p>
          ) : null}
          <p className="mt-1.5 text-[11px] leading-snug text-muted">
            {t("villas.checkIn")} {formatShortDate(villa.check_in)}
            {" · "}
            {t("villas.checkOut")} {formatShortDate(villa.check_out)}
          </p>
          {showAssignees ? (
            <p className="mt-1 truncate text-[11px] text-muted">
              <span className="font-semibold text-ink">
                {assignees.length
                  ? assignees.join(", ")
                  : t("tasks.unassigned")}
              </span>
            </p>
          ) : null}

          {hasExtra ? (
            <button
              type="button"
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? t("villas.cardLess") : t("villas.cardMore")}
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>
          ) : null}
        </div>

        <div className="absolute right-0.5 top-0.5 flex flex-col items-end gap-0.5">
          {canEdit ? (
            <Link
              href={`/villas/${villa.id}`}
              className="rounded-lg p-1.5 text-muted hover:bg-sand"
              aria-label={t("villas.editProperty")}
            >
              <PulseIcon name="edit" className="size-4" />
            </Link>
          ) : null}
          <Link
            href={`/villas/${villa.id}/stats`}
            className="rounded-lg p-1.5 text-sky hover:bg-sky/10"
            aria-label={t("villas.propertyNotes")}
          >
            <PulseIcon name="document" className="size-4" />
          </Link>
        </div>
      </div>

      {open && hasExtra ? (
        <div className="space-y-2 border-t border-black/5 px-3 py-3">
          <VillaFacts villa={villa} className="mt-0" />
          {villa.description ? (
            <p className="line-clamp-3 text-sm text-muted">
              <LocalizedText text={villa.description} />
            </p>
          ) : null}
          {villa.location_url ? (
            <a
              href={normalizeLocationUrl(villa.location_url)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
            >
              <ExternalLink className="size-3.5" />
              {t("villas.locationLink")}
            </a>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function villaFactCount(villa: VillaListItem): number {
  let n = 0;
  if (villa.bedrooms != null) n += 1;
  if (villa.bathrooms != null) n += 1;
  if (villa.max_guests != null) n += 1;
  if (villa.sq_m != null) n += 1;
  if (villa.has_pool != null) n += 1;
  if (villa.has_wifi != null) n += 1;
  if (villa.property_type) n += 1;
  return n;
}
