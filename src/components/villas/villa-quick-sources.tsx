"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  ImagePlus,
  Link2,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/provider";
import {
  lookupFamousPlace,
  type PlaceHit,
} from "@/lib/agent-chat/places";
import { cn } from "@/lib/utils";

export type VillaQuickSourcesValue = {
  listing_url: string;
  drive_url: string;
  source_notes: string;
  info_doc_url: string | null;
  info_doc_name: string | null;
};

export const EMPTY_VILLA_QUICK_SOURCES: VillaQuickSourcesValue = {
  listing_url: "",
  drive_url: "",
  source_notes: "",
  info_doc_url: null,
  info_doc_name: null,
};

type Props = {
  value: VillaQuickSourcesValue;
  onChange: (next: VillaQuickSourcesValue) => void;
  name: string;
  area: string;
  onNameChange: (next: string) => void;
  onAreaChange: (next: string) => void;
  /** Called when a place search result is chosen (fills maps + area). */
  onPlacePick?: (place: PlaceHit) => void;
  uploadDoc: (file: File) => Promise<string | null>;
};

export function VillaQuickSources({
  value,
  onChange,
  name,
  area,
  onNameChange,
  onAreaChange,
  onPlacePick,
  uploadDoc,
}: Props) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const shotRef = useRef<HTMLInputElement>(null);
  const [placeQuery, setPlaceQuery] = useState("");
  const [places, setPlaces] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [docBusy, setDocBusy] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [shotBusy, setShotBusy] = useState(false);
  const [shotError, setShotError] = useState<string | null>(null);
  const [shotName, setShotName] = useState<string | null>(null);

  const set = (patch: Partial<VillaQuickSourcesValue>) =>
    onChange({ ...value, ...patch });

  useEffect(() => {
    const q = placeQuery.trim();
    if (q.length < 3) {
      setPlaces([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearching(true);
      void lookupFamousPlace(q)
        .then((hits) => {
          if (!cancelled) setPlaces(hits);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [placeQuery]);

  const onDoc = async (file: File | null) => {
    if (!file) return;
    setDocBusy(true);
    setDocError(null);
    try {
      const url = await uploadDoc(file);
      if (!url) throw new Error(t("common.error"));
      set({ info_doc_url: url, info_doc_name: file.name });
    } catch (e) {
      setDocError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setDocBusy(false);
    }
  };

  const onScreenshot = async (file: File | null) => {
    if (!file) return;
    setShotBusy(true);
    setShotError(null);
    try {
      const url = await uploadDoc(file);
      if (!url) throw new Error(t("common.error"));
      setShotName(file.name);
      const noteLine = t("villas.screenshotAttached", { name: file.name });
      const nextNotes = value.source_notes.trim()
        ? `${value.source_notes.trim()}\n\n${noteLine}\n${url}`
        : `${noteLine}\n${url}`;
      set({
        drive_url: value.drive_url.trim() || url,
        source_notes: nextNotes,
      });
    } catch (e) {
      setShotError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setShotBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-canvas-deep/60 p-3">
      <div>
        <p className="text-sm font-semibold text-ink">
          {t("villas.quickSources")}
        </p>
        <p className="text-xs text-muted">{t("villas.quickSourcesHint")}</p>
      </div>

      <div>
        <Label>{t("villas.propertyName")}</Label>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t("villas.propertyNamePh")}
        />
      </div>
      <div>
        <Label>{t("villas.area")}</Label>
        <Input
          value={area}
          onChange={(e) => onAreaChange(e.target.value)}
          placeholder={t("villas.areaPh")}
        />
      </div>

      <div>
        <Label>{t("villas.placeLookup")}</Label>
        <div className="relative mt-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
          <Input
            value={placeQuery}
            onChange={(e) => setPlaceQuery(e.target.value)}
            placeholder={t("villas.placeLookupPh")}
            className="pl-9"
          />
        </div>
        <p className="mt-1 text-xs text-muted">{t("villas.placeLookupHint")}</p>
        {searching ? (
          <p className="mt-1 text-xs font-semibold text-muted">
            {t("common.loading")}
          </p>
        ) : null}
        {places.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {places.map((p) => (
              <li key={`${p.mapsUrl}-${p.label}`}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-2 rounded-xl border border-[var(--color-border)] bg-card px-3 py-2 text-left text-sm transition hover:border-primary/40",
                  )}
                  onClick={() => {
                    onPlacePick?.(p);
                    setPlaceQuery(p.label);
                    setPlaces([]);
                  }}
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">
                      {p.label}
                    </span>
                    {p.area ? (
                      <span className="block text-xs text-muted">{p.area}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div>
        <Label>{t("villas.listingUrl")}</Label>
        <div className="relative mt-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
          <Input
            value={value.listing_url}
            onChange={(e) => set({ listing_url: e.target.value })}
            placeholder={t("villas.listingUrlPh")}
            inputMode="url"
            className="pl-9"
          />
        </div>
        <p className="mt-1 text-xs text-muted">{t("villas.listingUrlHint")}</p>
      </div>

      <div>
        <Label>{t("villas.driveUrl")}</Label>
        <Input
          value={value.drive_url}
          onChange={(e) => set({ drive_url: e.target.value })}
          placeholder={t("villas.driveUrlPh")}
          inputMode="url"
        />
        <p className="mt-1 text-xs text-muted">{t("villas.driveUrlHint")}</p>
        <input
          ref={shotRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            e.target.value = "";
            void onScreenshot(file);
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="mt-2"
          reflectGlobalBusy={false}
          busy={shotBusy}
          onClick={() => shotRef.current?.click()}
        >
          <ImagePlus className="size-3.5" />
          {shotBusy ? t("villas.screenshotAnalyzing") : t("villas.screenshotUpload")}
        </Button>
        {shotName ? (
          <p className="mt-1 text-xs font-semibold text-ink">
            {t("villas.screenshotReady", { name: shotName })}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-muted">{t("villas.screenshotHint")}</p>
        {shotError ? <p className="mt-1 text-xs text-danger">{shotError}</p> : null}
      </div>

      <div>
        <Label>{t("villas.infoDoc")}</Label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            e.target.value = "";
            void onDoc(file);
          }}
        />
        {value.info_doc_url ? (
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-card px-3 py-2">
            <FileText className="size-4 shrink-0 text-primary" />
            <a
              href={value.info_doc_url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 truncate text-sm font-semibold text-ink underline-offset-2 hover:underline"
            >
              {value.info_doc_name || t("villas.infoDocAttached")}
            </a>
            <button
              type="button"
              className="rounded-full p-1 text-muted hover:text-danger"
              aria-label={t("common.remove")}
              onClick={() => set({ info_doc_url: null, info_doc_name: null })}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-1"
            reflectGlobalBusy={false}
            busy={docBusy}
            onClick={() => fileRef.current?.click()}
          >
            <FileText className="size-3.5" />
            {docBusy ? t("common.saving") : t("villas.infoDocAdd")}
          </Button>
        )}
        <p className="mt-1 text-xs text-muted">{t("villas.infoDocHint")}</p>
        {docError ? <p className="mt-1 text-xs text-danger">{docError}</p> : null}
      </div>

      <div>
        <Label>{t("villas.sourceNotes")}</Label>
        <Textarea
          rows={3}
          value={value.source_notes}
          onChange={(e) => set({ source_notes: e.target.value })}
          placeholder={t("villas.sourceNotesPh")}
        />
        <p className="mt-1 text-xs text-muted">{t("villas.sourceNotesHint")}</p>
      </div>
    </div>
  );
}

export function quickSourcesFromVilla(villa: {
  listing_url?: string | null;
  drive_url?: string | null;
  source_notes?: string | null;
  info_doc_url?: string | null;
  info_doc_name?: string | null;
}): VillaQuickSourcesValue {
  return {
    listing_url: villa.listing_url ?? "",
    drive_url: villa.drive_url ?? "",
    source_notes: villa.source_notes ?? "",
    info_doc_url: villa.info_doc_url ?? null,
    info_doc_name: villa.info_doc_name ?? null,
  };
}

export function quickSourcesPayload(value: VillaQuickSourcesValue) {
  return {
    listing_url: value.listing_url.trim() || null,
    drive_url: value.drive_url.trim() || null,
    source_notes: value.source_notes.trim() || null,
    info_doc_url: value.info_doc_url,
    info_doc_name: value.info_doc_url
      ? value.info_doc_name?.trim() || null
      : null,
  };
}
