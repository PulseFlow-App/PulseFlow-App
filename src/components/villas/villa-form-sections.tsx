"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import type { VillaEnrichment } from "@/lib/villas/enrich-from-source";
import type { VillaDetailsForm } from "@/lib/villas/property-details";

export function VillaExpandSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-card">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold text-ink">{title}</span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
          {open ? t("villas.collapseSection") : t("villas.expandSection")}
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
      </button>
      {open ? <div className="space-y-3 border-t border-black/5 px-3 py-3">{children}</div> : null}
    </div>
  );
}

export function applyVillaEnrichment(
  enrichment: VillaEnrichment,
  current: {
    name: string;
    area: string;
    description: string;
    locationUrl: string;
    details: VillaDetailsForm;
  },
): {
  name: string;
  area: string;
  description: string;
  locationUrl: string;
  details: VillaDetailsForm;
} {
  const details = { ...current.details };
  if (enrichment.bedrooms != null) details.bedrooms = String(enrichment.bedrooms);
  if (enrichment.bathrooms != null) details.bathrooms = String(enrichment.bathrooms);
  if (enrichment.max_guests != null) {
    details.max_guests = String(enrichment.max_guests);
  }
  if (enrichment.sq_m != null) details.sq_m = String(enrichment.sq_m);
  if (enrichment.has_pool != null) {
    details.has_pool = enrichment.has_pool ? "yes" : "no";
  }
  if (enrichment.has_wifi != null) {
    details.has_wifi = enrichment.has_wifi ? "yes" : "no";
  }
  if (enrichment.has_garden != null) {
    details.has_garden = enrichment.has_garden ? "yes" : "no";
  }
  if (enrichment.pet_friendly != null) {
    details.pet_friendly = enrichment.pet_friendly ? "yes" : "no";
  }
  if (enrichment.property_type) details.property_type = enrichment.property_type;
  if (enrichment.kitchen) details.kitchen = enrichment.kitchen;
  if (enrichment.parking) details.parking = enrichment.parking;
  if (enrichment.aircon) details.aircon = enrichment.aircon;
  if (enrichment.view) details.view = enrichment.view;

  const cleanedName = enrichment.name?.trim() ?? "";
  // Guard: never let a long blurb overwrite the property name field.
  const nameOk =
    cleanedName.length >= 2 &&
    cleanedName.length <= 36 &&
    cleanedName.split(/\s+/).length <= 5 &&
    !/[.!?]/.test(cleanedName.slice(0, -1));

  return {
    name: nameOk ? cleanedName : current.name,
    area: enrichment.area?.trim() || current.area,
    description: enrichment.description?.trim() || current.description,
    locationUrl: enrichment.location_url?.trim() || current.locationUrl,
    details,
  };
}
