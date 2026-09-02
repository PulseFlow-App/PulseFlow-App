"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import { isGuestApp } from "@/lib/roles";
import { isConfirmedStay } from "@/lib/guest/confirmed-stay";
import { isSupportSystemMessage } from "@/lib/guest/support-deposit-command";

export function GuestSupportChat() {
  const data = useData();
  const { t } = useI18n();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stay = isConfirmedStay(data.activeStay) ? data.activeStay : null;
  const messages = data.supportMessages.filter((m) => m.stay_id === stay?.id);
  const me = data.profile?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await data.sendSupportMessage(body);
      setBody("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSending(false);
    }
  };

  if (!stay) {
    return (
      <EmptyState
        title={t("guest.supportTitle")}
        description={t("guest.supportNoStay")}
      />
    );
  }

  return (
    <div className="flex min-h-[70dvh] flex-col animate-rise">
      <div className="mb-3">
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("guest.supportTitle")}
        </h1>
        <p className="text-sm text-muted">{t("guest.supportHint")}</p>
        {data.profile?.role === "guest" ? (
          <p className="mt-1 text-xs text-muted">{t("guest.supportDepositHint")}</p>
        ) : null}
      </div>

      <Card className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex-1 space-y-2 overflow-y-auto px-1 py-2">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {t("guest.supportEmpty")}
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === me;
              const system = isSupportSystemMessage(m.body);
              return (
                <div
                  key={m.id}
                  className={cn("flex", system ? "justify-center" : mine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                      system
                        ? "bg-secondary/10 text-secondary"
                        : mine
                          ? "bg-primary text-white"
                          : "bg-[#F7F5F1] text-ink",
                    )}
                  >
                    {!mine && !system ? (
                      <p className="mb-0.5 text-[11px] font-bold opacity-70">
                        {m.sender?.full_name ?? t("guest.host")}
                      </p>
                    ) : null}
                    <LocalizedText
                      text={m.body}
                      as="p"
                      className="whitespace-pre-wrap"
                    />
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex gap-2">
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("guest.supportPlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <Button
            type="button"
            disabled={sending || !body.trim()}
            onClick={() => void send()}
            aria-label={t("guest.send")}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** Owner/manager reply into guest stay support threads. */
export function HostSupportInbox() {
  const data = useData();
  const { t } = useI18n();
  const role = data.profile?.role;
  const [stayId, setStayId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!role || isGuestApp(role)) return null;
  if (role !== "owner" && role !== "manager") return null;

  const stays = data.guestStays.filter(
    (s) => s.status === "active" || s.status === "upcoming",
  );
  if (!stays.length) return null;

  const activeId = stayId ?? stays[0]?.id ?? null;
  const messages = data.supportMessages.filter((m) => m.stay_id === activeId);

  const send = async () => {
    if (!activeId || !body.trim()) return;
    setError(null);
    try {
      await data.sendSupportMessage(body, activeId);
      setBody("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    }
  };

  return (
    <Card className="mb-4 space-y-3 p-4">
      <div>
        <p className="text-sm font-bold text-ink">{t("guest.hostInboxTitle")}</p>
        <p className="text-xs text-muted">{t("guest.supportHint")}</p>
        <p className="text-xs text-muted">{t("guest.supportDepositHostHint")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {stays.map((s) => {
          const guest = data.profiles.find((p) => p.id === s.guest_profile_id);
          const villa = data.villas.find((v) => v.id === s.villa_id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStayId(s.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold",
                activeId === s.id
                  ? "bg-primary text-white"
                  : "bg-[#F7F5F1] text-ink",
              )}
            >
              {guest?.full_name ?? "Guest"}
              {villa ? ` · ${villa.name}` : ""}
            </button>
          );
        })}
      </div>
      <div className="max-h-48 space-y-2 overflow-y-auto">
        {messages.map((m) => (
          <p key={m.id} className="text-sm text-ink">
            <span className="font-bold">
              {m.sender?.full_name ?? t("guest.host")}:
            </span>{" "}
            <LocalizedText text={m.body} />
          </p>
        ))}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("guest.supportHostPlaceholder")}
        />
        <Button type="button" onClick={() => void send()} disabled={!body.trim()}>
          <Send className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
