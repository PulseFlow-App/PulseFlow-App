"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { SupportMessageBubble } from "@/components/guest/support-message-bubble";
import { useData } from "@/lib/data/use-app-data";
import { cn, formatShortDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { isGuestApp } from "@/lib/roles";
import {
  canUseSupportStay,
  isConfirmedStayStatus,
  pickGuestSupportStay,
} from "@/lib/guest/confirmed-stay";
import {
  GUEST_SUPPORT_COMMANDS,
  HOST_SUPPORT_COMMANDS,
  supportCommandSuggestions,
} from "@/lib/guest/support-command-suggestions";
import { refundableDepositBalance } from "@/lib/guest/handle-support-refund";

export function GuestSupportChat() {
  const data = useData();
  const { t } = useI18n();
  const [body, setBody] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stay = pickGuestSupportStay(data.guestStays);
  const canSend = canUseSupportStay(stay, data.profile?.role);
  const messages = data.supportMessages.filter((m) => m.stay_id === stay?.id);
  const me = data.profile?.id;
  const isGuest = data.profile?.role === "guest";
  const commandSuggestions =
    isGuest && canSend
      ? supportCommandSuggestions(body, GUEST_SUPPORT_COMMANDS)
      : [];
  const canSubmit = Boolean(body.trim() || pendingFile);
  const stayDeposit = stay
    ? data.guestDeposits.find((d) => d.stay_id === stay.id)
    : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    setActiveSuggestion(0);
  }, [body]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearAttachment = () => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPickFile = (file: File | null) => {
    clearAttachment();
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("guest.supportReceiptImageOnly"));
      return;
    }
    setError(null);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const applySuggestion = (command: string) => {
    setBody(`${command} `);
    inputRef.current?.focus();
  };

  const send = async () => {
    if (!canSend || !canSubmit || sending) return;
    setSending(true);
    setError(null);
    try {
      let attachmentUrl: string | null = null;
      if (pendingFile) {
        attachmentUrl = await data.uploadSupportAttachment(pendingFile);
        if (!attachmentUrl) throw new Error(t("common.error"));
      }
      let messageText = body.trim();
      if (!messageText && pendingFile && stayDeposit?.status === "due") {
        messageText = "/deposit";
      }
      await data.sendSupportMessage(messageText, undefined, { attachmentUrl });
      setBody("");
      clearAttachment();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSending(false);
    }
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (commandSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((i) => (i + 1) % commandSuggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion(
          (i) => (i - 1 + commandSuggestions.length) % commandSuggestions.length,
        );
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && commandSuggestions.length)) {
        e.preventDefault();
        applySuggestion(commandSuggestions[activeSuggestion]?.command ?? "");
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setBody("");
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
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
        <p className="text-sm leading-relaxed text-muted">
          {t("guest.supportHint")}
        </p>
      </div>

      <Card className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex-1 space-y-2 overflow-y-auto px-1 py-2">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {t("guest.supportEmpty")}
            </p>
          ) : (
            messages.map((m) => (
              <SupportMessageBubble
                key={m.id}
                message={m}
                mine={m.sender_id === me}
                hostLabel={t("guest.host")}
                receiptLabel={t("guest.supportReceipt")}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {canSend ? (
          <div className="space-y-2">
            {previewUrl ? (
              <div className="relative inline-block max-w-[8rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={t("guest.supportReceipt")}
                  className="h-20 w-20 rounded-xl object-cover ring-1 ring-black/10"
                />
                <button
                  type="button"
                  onClick={clearAttachment}
                  className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-ink text-white shadow"
                  aria-label={t("guest.supportRemoveReceipt")}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : null}
            <div className="relative flex gap-2">
              {commandSuggestions.length > 0 ? (
                <ul
                  className="absolute inset-x-0 bottom-full z-10 mb-2 max-h-44 overflow-y-auto rounded-2xl bg-white py-1 shadow-[0_12px_32px_rgba(28,28,30,0.16)] ring-1 ring-black/5 animate-rise"
                  role="listbox"
                  aria-label={t("guest.supportCommandsList")}
                >
                  {commandSuggestions.map((item, index) => (
                    <li
                      key={item.command}
                      role="option"
                      aria-selected={index === activeSuggestion}
                    >
                      <button
                        type="button"
                        className={cn(
                          "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition",
                          index === activeSuggestion
                            ? "bg-[#F7F5F1]"
                            : "hover:bg-[#F7F5F1]/80",
                        )}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applySuggestion(item.command)}
                      >
                        <span className="font-mono text-sm font-bold text-primary">
                          {item.command}
                        </span>
                        <span className="text-xs leading-snug text-muted">
                          {t(item.descriptionKey)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="ghost"
                className="shrink-0 px-3"
                disabled={sending}
                onClick={() => fileRef.current?.click()}
                aria-label={t("guest.supportAttachReceipt")}
              >
                <Paperclip className="size-4" />
              </Button>
              <Input
                ref={inputRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("guest.supportPlaceholder")}
                onKeyDown={onInputKeyDown}
                aria-autocomplete="list"
                aria-expanded={commandSuggestions.length > 0}
                disabled={sending}
              />
              <Button
                type="button"
                disabled={sending || !canSubmit}
                onClick={() => void send()}
                aria-label={t("guest.send")}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stays = useMemo(() => {
    return data.guestStays
      .filter((s) => {
        if (isConfirmedStayStatus(s.status)) return true;
        if (s.status !== "cancelled") return false;
        const deposit = data.guestDeposits.find((d) => d.stay_id === s.id);
        return (
          refundableDepositBalance(deposit) > 0 || deposit?.status === "refunded"
        );
      })
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [data.guestStays, data.guestDeposits]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    setActiveSuggestion(0);
  }, [body]);

  if (!role || isGuestApp(role)) return null;
  if (role !== "owner" && role !== "manager") return null;
  if (!stays.length) return null;

  const activeId = stayId ?? stays[0]?.id ?? null;
  const messages = data.supportMessages.filter((m) => m.stay_id === activeId);
  const me = data.profile?.id;
  const activeDeposit = activeId
    ? data.guestDeposits.find((d) => d.stay_id === activeId)
    : null;
  const commandSuggestions = supportCommandSuggestions(
    body,
    HOST_SUPPORT_COMMANDS,
  );
  const canSubmit = Boolean(body.trim() || pendingFile);

  const clearAttachment = () => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPickFile = (file: File | null) => {
    clearAttachment();
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("guest.supportReceiptImageOnly"));
      return;
    }
    setError(null);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const applySuggestion = (command: string) => {
    setBody(`${command} `);
    inputRef.current?.focus();
  };

  const send = async () => {
    if (!activeId || !canSubmit || sending) return;
    setSending(true);
    setError(null);
    try {
      let attachmentUrl: string | null = null;
      if (pendingFile) {
        attachmentUrl = await data.uploadSupportAttachment(pendingFile);
        if (!attachmentUrl) throw new Error(t("common.error"));
      }
      let messageText = body.trim();
      if (
        !messageText &&
        pendingFile &&
        refundableDepositBalance(activeDeposit) > 0
      ) {
        messageText = "/refund";
      }
      await data.sendSupportMessage(messageText, activeId, { attachmentUrl });
      setBody("");
      clearAttachment();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSending(false);
    }
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (commandSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((i) => (i + 1) % commandSuggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion(
          (i) => (i - 1 + commandSuggestions.length) % commandSuggestions.length,
        );
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && commandSuggestions.length)) {
        e.preventDefault();
        applySuggestion(commandSuggestions[activeSuggestion]?.command ?? "");
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <Card className="mb-4 space-y-3 p-4">
      <div>
        <p className="text-sm font-bold text-ink">{t("guest.hostInboxTitle")}</p>
        <p className="text-xs text-muted">{t("guest.supportDepositHostHint")}</p>
        <p className="text-xs text-muted">{t("guest.supportRefundHostHint")}</p>
        <p className="text-xs text-muted">{t("guest.supportCancelHostHint")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {stays.map((s) => {
          const guest = data.profiles.find((p) => p.id === s.guest_profile_id);
          const villa = data.villas.find((v) => v.id === s.villa_id);
          const cancelled = s.status === "cancelled";
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
              {cancelled ? ` · ${t("guest.bookingCancelled")}` : ""}
            </button>
          );
        })}
      </div>
      <div className="max-h-48 space-y-2 overflow-y-auto">
        {messages.map((m) => (
          <SupportMessageBubble
            key={m.id}
            message={m}
            mine={m.sender_id === me}
            hostLabel={t("guest.host")}
            receiptLabel={t("guest.supportReceipt")}
          />
        ))}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {previewUrl ? (
        <div className="relative inline-block max-w-[8rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={t("guest.supportRefundProof")}
            className="h-20 w-20 rounded-xl object-cover ring-1 ring-black/10"
          />
          <button
            type="button"
            onClick={clearAttachment}
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-ink text-white shadow"
            aria-label={t("guest.supportRemoveReceipt")}
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}
      <div className="relative flex gap-2">
        {commandSuggestions.length > 0 ? (
          <ul
            className="absolute inset-x-0 bottom-full z-10 mb-2 max-h-44 overflow-y-auto rounded-2xl bg-white py-1 shadow-[0_12px_32px_rgba(28,28,30,0.16)] ring-1 ring-black/5 animate-rise"
            role="listbox"
            aria-label={t("guest.supportCommandsList")}
          >
            {commandSuggestions.map((item, index) => (
              <li
                key={item.command}
                role="option"
                aria-selected={index === activeSuggestion}
              >
                <button
                  type="button"
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition",
                    index === activeSuggestion
                      ? "bg-[#F7F5F1]"
                      : "hover:bg-[#F7F5F1]/80",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(item.command)}
                >
                  <span className="font-mono text-sm font-bold text-primary">
                    {item.command}
                  </span>
                  <span className="text-xs leading-snug text-muted">
                    {t(item.descriptionKey)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="ghost"
          className="shrink-0 px-3"
          disabled={sending}
          onClick={() => fileRef.current?.click()}
          aria-label={t("guest.supportAttachRefund")}
        >
          <Paperclip className="size-4" />
        </Button>
        <Input
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("guest.supportHostPlaceholder")}
          onKeyDown={onInputKeyDown}
          disabled={sending}
        />
        <Button
          type="button"
          onClick={() => void send()}
          disabled={sending || !canSubmit}
        >
          <Send className="size-4" />
        </Button>
      </div>
      {activeDeposit && refundableDepositBalance(activeDeposit) > 0 ? (
        <p className="text-xs text-muted">
          {t("guest.supportRefundRemaining", {
            amount: `${refundableDepositBalance(activeDeposit)} ${activeDeposit.currency}`,
            dates: activeId
              ? (() => {
                  const s = stays.find((x) => x.id === activeId);
                  return s
                    ? `${formatShortDate(s.check_in)} → ${formatShortDate(s.check_out)}`
                    : "";
                })()
              : "",
          })}
        </p>
      ) : null}
    </Card>
  );
}
