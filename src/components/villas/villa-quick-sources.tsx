"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, FileText, Loader2, Mic, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/provider";
import type { VillaEnrichment } from "@/lib/villas/enrich-from-source";
import {
  getSpeechRecognitionCtor,
  speechLocale,
  speechRecognitionSupported,
  type SpeechRecognitionLike,
} from "@/lib/villas/speech-recognition";
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
  /** Apply parsed listing facts into the rest of the property form. */
  onEnrich?: (enrichment: VillaEnrichment) => void;
  uploadDoc: (file: File) => Promise<string | null>;
  /** Hide the section title when wrapped in VillaExpandSection. */
  embedded?: boolean;
};

function AcceptTick({
  busy,
  disabled,
  onClick,
  label,
}: {
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled || busy}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition",
        disabled
          ? "border-[var(--color-border)] text-muted opacity-40"
          : "border-secondary/40 bg-secondary-soft text-secondary-dark hover:border-secondary",
      )}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Check className="size-4" strokeWidth={2.6} />
      )}
    </button>
  );
}

export function VillaQuickSources({
  value,
  onChange,
  onEnrich,
  uploadDoc,
  embedded = false,
}: Props) {
  const { t, locale } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [docBusy, setDocBusy] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [listingBusy, setListingBusy] = useState(false);
  const [pasteBusy, setPasteBusy] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [interimVoice, setInterimVoice] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [enrichNote, setEnrichNote] = useState<string | null>(null);

  const set = (patch: Partial<VillaQuickSourcesValue>) =>
    onChange({ ...value, ...patch });

  useEffect(() => {
    setVoiceSupported(speechRecognitionSupported());
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const acceptListing = async () => {
    const url = value.listing_url.trim();
    if (!url) return;
    setListingBusy(true);
    setEnrichError(null);
    setEnrichNote(null);
    try {
      const res = await fetch("/api/listings/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as {
        enrichment?: VillaEnrichment;
        warning?: string | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || t("common.error"));
      if (data.enrichment) onEnrich?.(data.enrichment);
      if (data.warning) setEnrichNote(data.warning);
      else setEnrichNote(t("villas.enrichApplied"));
    } catch (e) {
      setEnrichError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setListingBusy(false);
    }
  };

  const enrichFromText = async (text: string, setBusy: (v: boolean) => void) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setBusy(true);
    setEnrichError(null);
    setEnrichNote(null);
    try {
      const res = await fetch("/api/listings/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = (await res.json()) as {
        enrichment?: VillaEnrichment;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || t("common.error"));
      if (data.enrichment) onEnrich?.(data.enrichment);
      setEnrichNote(t("villas.enrichApplied"));
    } catch (e) {
      setEnrichError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const acceptPaste = () => void enrichFromText(value.source_notes, setPasteBusy);

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterimVoice("");
  };

  const startVoice = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setVoiceSupported(false);
      setEnrichError(t("villas.voiceUnsupported"));
      return;
    }
    setEnrichError(null);
    setEnrichNote(null);
    recognitionRef.current?.abort();
    const recognition = new Ctor();
    recognition.lang = speechLocale(locale);
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (ev) => {
      let finalChunk = "";
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const result = ev.results[i];
        if (!result) continue;
        const piece = result[0]?.transcript ?? "";
        if (result.isFinal) finalChunk += piece;
        else interim += piece;
      }
      if (finalChunk.trim()) {
        setVoiceText((prev) =>
          prev.trim() ? `${prev.trim()} ${finalChunk.trim()}` : finalChunk.trim(),
        );
      }
      setInterimVoice(interim.trim());
    };
    recognition.onerror = (ev) => {
      if (ev.error === "aborted" || ev.error === "no-speech") return;
      setEnrichError(
        ev.error === "not-allowed"
          ? t("villas.voiceUnsupported")
          : t("common.error"),
      );
      setListening(false);
      setInterimVoice("");
    };
    recognition.onend = () => {
      setListening(false);
      setInterimVoice("");
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setEnrichError(t("common.error"));
      setListening(false);
    }
  };

  const acceptVoice = async () => {
    if (listening) stopVoice();
    const transcript = [voiceText, interimVoice].filter(Boolean).join(" ").trim();
    if (!transcript) {
      setEnrichError(t("villas.voiceEmpty"));
      return;
    }
    // Keep transcript with other source notes for the saved property record.
    const merged = value.source_notes.trim()
      ? `${value.source_notes.trim()}\n\n${transcript}`
      : transcript;
    set({ source_notes: merged });
    await enrichFromText(transcript, setVoiceBusy);
  };

  const acceptDoc = async () => {
    if (!value.info_doc_url) return;
    // Docs are attached for the team; paste text is the parse path.
    setEnrichNote(t("villas.enrichDocAttached"));
  };

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

  return (
    <div
      className={
        embedded
          ? "space-y-3"
          : "space-y-3 rounded-2xl border border-[var(--color-border)] bg-canvas-deep/60 p-3"
      }
    >
      {!embedded ? (
        <div>
          <p className="text-sm font-semibold text-ink">
            {t("villas.quickSources")}
          </p>
          {t("villas.quickSourcesHint") ? (
            <p className="text-xs text-muted">{t("villas.quickSourcesHint")}</p>
          ) : null}
        </div>
      ) : t("villas.quickSourcesHint") ? (
        <p className="text-xs text-muted">{t("villas.quickSourcesHint")}</p>
      ) : null}

      <div>
        <Label>{t("villas.listingUrl")}</Label>
        <div className="mt-1 flex items-center gap-2">
          <Input
            value={value.listing_url}
            onChange={(e) => set({ listing_url: e.target.value })}
            className="min-w-0 flex-1 pl-4"
          />
          <AcceptTick
            label={t("villas.acceptListing")}
            disabled={!value.listing_url.trim()}
            busy={listingBusy}
            onClick={() => void acceptListing()}
          />
        </div>
      </div>

      <div>
        <Label>{t("villas.infoDoc")}</Label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            e.target.value = "";
            void onDoc(file);
          }}
        />
        <div className="mt-1 flex items-center gap-2">
          {value.info_doc_url ? (
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-card px-3 py-2">
              <FileText className="size-4 shrink-0 text-primary" />
              <a
                href={value.info_doc_url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-sm font-semibold text-ink"
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
              className="flex-1"
              reflectGlobalBusy={false}
              busy={docBusy}
              onClick={() => fileRef.current?.click()}
            >
              <FileText className="size-3.5" />
              {docBusy ? t("common.saving") : t("villas.infoDocAdd")}
            </Button>
          )}
          <AcceptTick
            label={t("villas.acceptDoc")}
            disabled={!value.info_doc_url}
            onClick={() => void acceptDoc()}
          />
        </div>
        {docError ? <p className="mt-1 text-xs text-danger">{docError}</p> : null}
      </div>

      <div>
        <Label>{t("villas.sourceNotes")}</Label>
        <div className="mt-1 flex items-start gap-2">
          <Textarea
            rows={3}
            value={value.source_notes}
            onChange={(e) => set({ source_notes: e.target.value })}
            className="min-w-0 flex-1"
          />
          <AcceptTick
            label={t("villas.acceptPaste")}
            disabled={!value.source_notes.trim()}
            busy={pasteBusy}
            onClick={() => void acceptPaste()}
          />
        </div>
      </div>

      <div>
        <Label>{t("villas.voiceNote")}</Label>
        {!voiceSupported ? (
          <p className="mt-1 text-xs text-muted">{t("villas.voiceUnsupported")}</p>
        ) : (
          <>
            <div className="mt-1 flex items-start gap-2">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {listening ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      reflectGlobalBusy={false}
                      onClick={stopVoice}
                    >
                      <Square className="size-3.5 fill-current" />
                      {t("villas.voiceStop")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      reflectGlobalBusy={false}
                      onClick={startVoice}
                    >
                      <Mic className="size-3.5" />
                      {t("villas.voiceStart")}
                    </Button>
                  )}
                  {listening ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <span className="size-2 animate-pulse rounded-full bg-primary" />
                      {t("villas.voiceListening")}
                    </span>
                  ) : null}
                </div>
                <Textarea
                  rows={3}
                  value={
                    interimVoice
                      ? voiceText
                        ? `${voiceText} ${interimVoice}`
                        : interimVoice
                      : voiceText
                  }
                  onChange={(e) => {
                    setVoiceText(e.target.value);
                    setInterimVoice("");
                  }}
                  className="min-w-0"
                />
              </div>
              <AcceptTick
                label={t("villas.acceptVoice")}
                disabled={!voiceText.trim() && !interimVoice.trim()}
                busy={voiceBusy}
                onClick={() => void acceptVoice()}
              />
            </div>
          </>
        )}
      </div>

      {enrichNote ? (
        <p className="text-xs font-semibold text-secondary-dark">{enrichNote}</p>
      ) : null}
      {enrichError ? (
        <p className="text-xs text-danger">{enrichError}</p>
      ) : null}
    </div>
  );
}

export function CompanySelectField({
  value,
  onChange,
  companies,
  personalLabel,
  companyKindLabel,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  companies: { id: string; name: string }[];
  personalLabel: string;
  companyKindLabel: string;
  label: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative mt-1">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-card px-4 pe-10 text-sm font-semibold text-ink"
        >
          {companies.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} ({companyKindLabel})
            </option>
          ))}
          <option value="personal">{personalLabel}</option>
        </select>
        <ChevronDown
          className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
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
