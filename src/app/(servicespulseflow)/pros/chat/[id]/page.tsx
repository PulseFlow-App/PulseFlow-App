"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readPhoto } from "@/components/pros/parts";
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
  title: string;
  peerName: string;
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
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not open chat.");
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
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not send that.");
        return;
      }
      setText("");
      setPhoto(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

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
          <div>
            <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{payload.title}</h1>
            {payload.peerName ? <p className="text-pf-16 text-pf-text-secondary">{payload.peerName}</p> : null}
          </div>
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
                <p className="text-pf-14 text-pf-text-secondary">{t("chatPhotoHint")}</p>
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
    </div>
  );
}
