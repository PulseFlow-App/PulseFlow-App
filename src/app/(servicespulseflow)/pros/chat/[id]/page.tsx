"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readPhoto } from "@/components/pros/parts";
import { quoteLabel } from "@/lib/pros/delivery";
import { OrderActions, cancelReasonText } from "@/components/pros/order-actions";
import { needsWorkPermit } from "@/lib/pros/permit";
import { QuoteModal, QuoteTag, type QuoteInput } from "@/components/pros/quote-form";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";
import { useLocalizedText } from "@/lib/translate/use-localized-content";
import { prepareVillaPhotoFile } from "@/lib/villas/prepare-photo";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  photoUrl: string | null;
  createdAt: string;
};

type ChatPayload = {
  open: boolean;
  accepted: boolean;
  staff?: boolean;
  title: string;
  peerName: string;
  quoteMin?: number | null;
  quoteMax?: number | null;
  quoteCurrency?: string | null;
  quoteNote?: string | null;
  cancelled?: boolean;
  cancelReason?: string | null;
  description?: string;
  whenLabel?: string | null;
  messages: ChatMessage[];
  error?: string;
};

function ChatBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  const { t } = usePros();
  const { display } = useLocalizedText(message.body);
  const [originalOpen, setOriginalOpen] = useState(false);
  const changed = Boolean(message.body) && display.trim() !== message.body.trim();
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] space-y-2 rounded-[20px] px-3 py-2",
          mine ? "bg-pf-navy-900 text-pf-on-panel" : "border border-pf-line bg-pf-card text-pf-ink",
        )}
      >
        {message.photoUrl ? (
          <img src={message.photoUrl} alt="" className="max-h-48 w-full rounded-[14px] object-cover" />
        ) : null}
        {message.body ? <p className="whitespace-pre-wrap text-pf-16">{display || message.body}</p> : null}
        {changed ? (
          <button
            type="button"
            className={cn("min-h-11 text-pf-14 font-medium", mine ? "text-pf-on-panel/80" : "text-pf-text-secondary")}
            onClick={() => setOriginalOpen((open) => !open)}
          >
            {t("showOriginal")}
          </button>
        ) : null}
        {originalOpen ? <p className="whitespace-pre-wrap text-pf-14 opacity-80">{message.body}</p> : null}
      </div>
    </div>
  );
}

export default function ServiceChatPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const { actor, t } = usePros();
  const { dir } = useI18n();
  const [payload, setPayload] = useState<ChatPayload | null>(null);
  const [missing, setMissing] = useState(false);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [nationality, setNationality] = useState<string | null>(null);
  const [permitQuote, setPermitQuote] = useState<QuoteInput | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const back = servicesPath(pathname, actor?.role === "staff" || actor?.role === "cleaner" ? "/inbox" : "/requests");

  const load = useCallback(async () => {
    const res = await fetch(`/api/services/chat?id=${encodeURIComponent(params.id)}`, { cache: "no-store" });
    if (res.status === 404) {
      setMissing(true);
      return;
    }
    const body = (await res.json()) as ChatPayload;
    if (!res.ok && !body.title) {
      setError(body.error ?? t("chatEmpty"));
      return;
    }
    setPayload(body);
    if (body.error) setError(body.error);
  }, [params.id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetch("/api/services/profile", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { profile?: { nationality?: string | null } | null } | null) => {
        setNationality(body?.profile?.nationality ?? null);
      })
      .catch(() => setNationality(null));
  }, []);

  useEffect(() => {
    if (!payload?.open) return;
    const timer = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(timer);
  }, [load, payload?.open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [payload?.messages.length]);

  const unlock = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/services/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: params.id, unlock: true }),
      });
      if (!res.ok) {
        setError(t("chatOpenFailed"));
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!text.trim() && !photo) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/services/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: params.id, body: text.trim(), ...(photo ? { photo } : {}) }),
      });
      if (!res.ok) {
        setError(t("chatSendFailed"));
        return;
      }
      setText("");
      setPhoto(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const postQuote = async (quote: QuoteInput) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/services/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: params.id,
          action: "quote",
          min: quote.min,
          max: quote.max,
          currency: quote.currency,
          note: quote.note,
        }),
      });
      if (!res.ok) {
        setError(t("quoteSaveFailed"));
        return;
      }
      setQuoteOpen(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const acceptQuote = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/services/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: params.id, action: "accept" }),
      });
      if (!res.ok) {
        setError(t("quoteConfirmFailed"));
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  const price = payload
    ? quoteLabel({
        reply_amount: payload.quoteMin,
        quote_max: payload.quoteMax,
        reply_currency: payload.quoteCurrency,
      })
    : null;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      const prepared = await prepareVillaPhotoFile(file, 1280);
      const data = await readPhoto(prepared);
      if (!data) {
        setError(t("photoTooBig"));
        return;
      }
      setError(null);
      setPhoto(data);
    } catch {
      setError(t("photoTooBig"));
    }
  };

  return (
    <div className="space-y-3">
      <Link
        href={back}
        className="inline-flex min-h-11 items-center gap-1 rounded-full border border-pf-line bg-pf-card px-3 text-pf-14 font-medium text-pf-ink"
      >
        <ArrowLeft className={cn("size-4", dir === "rtl" && "rotate-180")} strokeWidth={2} aria-hidden />
        {t("back")}
      </Link>
      {missing ? <p className="text-pf-16 text-pf-text-secondary">{t("emptyRequests")}</p> : null}
      {payload ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{payload.title}</h1>
              {payload.peerName ? <p className="text-pf-16 text-pf-text-secondary">{payload.peerName}</p> : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {price && !payload.cancelled ? <QuoteTag label={price} /> : null}
              {payload.staff && !payload.accepted && !payload.cancelled ? (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-pf-line bg-pf-card px-3 text-pf-14 font-medium text-pf-ink"
                  onClick={() => setQuoteOpen(true)}
                >
                  {t("provideQuote")}
                </button>
              ) : null}
            </div>
          </div>
          {payload.quoteNote && !payload.cancelled ? (
            <p className="whitespace-pre-wrap text-pf-16 text-pf-text-secondary">{payload.quoteNote}</p>
          ) : null}
          {payload.cancelled ? (
            <p className="whitespace-pre-wrap text-pf-16 text-pf-text-secondary">
              {t("cancelled")}
              {cancelReasonText(payload.cancelReason, t) ? `\n${cancelReasonText(payload.cancelReason, t)}` : ""}
            </p>
          ) : null}
          <OrderActions
            id={params.id}
            title={payload.title}
            description={payload.description ?? ""}
            whenLabel={payload.whenLabel ?? null}
            cancelled={payload.cancelled}
            onChanged={() => void load()}
          />
          {payload.open && !payload.staff && price && !payload.accepted && !payload.cancelled ? (
            <button
              type="button"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-pf-navy-600 px-4 text-pf-16 font-medium text-white"
              disabled={busy}
              onClick={() => void acceptQuote()}
            >
              {t("confirmQuote")}
            </button>
          ) : null}
          {payload.open ? (
            <>
              <div className="space-y-2">
                {payload.messages.length === 0 ? <p className="text-pf-16 text-pf-text-secondary">{t("chatEmpty")}</p> : null}
                {payload.messages.map((message) => (
                  <ChatBubble key={message.id} message={message} mine={message.senderId === actor?.id} />
                ))}
                <div ref={endRef} />
              </div>
              <div className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-3">
                {photo ? (
                  <div className="flex items-center gap-3">
                    <img src={photo} alt="" className="size-16 rounded-[14px] object-cover" />
                    <button
                      type="button"
                      className="min-h-11 text-pf-14 font-medium text-pf-ink underline"
                      onClick={() => setPhoto(null)}
                    >
                      {t("chatRemovePhoto")}
                    </button>
                  </div>
                ) : null}
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={t("chatPlaceholder")}
                  rows={3}
                  className="w-full resize-none rounded-[14px] border border-pf-line bg-pf-page px-3 py-2 text-pf-16 text-pf-ink outline-none"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-14 font-medium text-pf-ink"
                    onClick={() => fileRef.current?.click()}
                  >
                    {t("chatPhoto")}
                  </button>
                  <Button type="button" className="min-h-11" disabled={busy || (!text.trim() && !photo)} onClick={() => void send()}>
                    {t("chatSend")}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/*"
                    className="sr-only"
                    onChange={(event) => {
                      void pick(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <section className="space-y-3 rounded-[20px] border border-pf-line bg-pf-card p-4">
              <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{t("chatLocked")}</p>
              <Button type="button" className="min-h-12 w-full" disabled={busy} onClick={() => void unlock()}>
                {t("openChat")}
              </Button>
            </section>
          )}
        </>
      ) : null}
      {error ? <p className="text-pf-14 font-medium text-pf-danger-ink">{error}</p> : null}
      <QuoteModal
        open={quoteOpen}
        busy={busy}
        onClose={() => setQuoteOpen(false)}
        onSubmit={(quote) => {
          if (needsWorkPermit(nationality)) {
            setPermitQuote(quote);
            setQuoteOpen(false);
            return;
          }
          void postQuote(quote);
        }}
      />
      {permitQuote ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-pf-ink/40 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-[28px] bg-pf-card p-5">
            <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("permitTitle")}</h2>
            <p className="mt-2 text-pf-16 leading-relaxed text-pf-text-secondary">{t("permitBody")}</p>
            <button
              type="button"
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-pf-orange-500 px-4 text-pf-16 font-medium text-white"
              onClick={() => {
                const quote = permitQuote;
                setPermitQuote(null);
                void fetch("/api/services/profile", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ confirmThai: true }),
                })
                  .then(() => setNationality("Thai"))
                  .finally(() => void postQuote(quote));
              }}
            >
              {t("permitContinue")}
            </button>
            <button
              type="button"
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink"
              onClick={() => setPermitQuote(null)}
            >
              {t("permitNotNow")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
