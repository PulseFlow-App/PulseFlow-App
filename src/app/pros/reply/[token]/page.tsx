"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { areaName, categoryName } from "@/lib/pros/matching";
import { preferredDateKey, preferredTimeKey } from "@/lib/pros/i18n";
import { usePros } from "@/lib/pros/store";
import { formatLongDateLocalized } from "@/lib/i18n/date-format";
import { useI18n } from "@/lib/i18n/provider";
import { parseISO } from "date-fns";

export default function ReplyPage() {
  const params = useParams<{ token: string }>();
  const { state, ready, t, reply } = usePros();
  const { locale } = useI18n();
  const offer = state.offers.find((row) => row.token === params.token);
  const request = state.requests.find((row) => row.id === offer?.requestId);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [message, setMessage] = useState("");
  const [when, setWhen] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;
  if (!offer || !request) {
    return (
      <div className="space-y-3">
        <Link href="/" className="inline-flex min-h-11 items-center text-pf-14 font-medium text-pf-ink">
          {t("home")}
        </Link>
        <p className="text-pf-14 text-pf-text-secondary">{t("unknownLink")}</p>
      </div>
    );
  }

  const send = (action: "quote" | "decline" | "time") => {
    const result = reply({
      token: offer.token,
      action,
      amount: amount.trim() ? Number(amount) : null,
      currency: currency.trim() || null,
      message,
      proposedTime: when.trim() || null,
    });
    if (!result.ok) {
      setError(t("tooShort"));
      return;
    }
    setDone(action === "decline" ? t("declinedSent") : t("quoteSent"));
  };

  return (
    <div className="space-y-4">
      <Link href="/" className="inline-flex min-h-11 items-center text-pf-14 font-medium text-pf-ink">
        {t("home")}
      </Link>
      <p className="text-pf-14 text-pf-text-secondary">{t("replyHint")}</p>
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{request.title}</h1>
      <p className="whitespace-pre-wrap text-pf-16 text-pf-ink">{request.description}</p>
      <p className="text-pf-14 text-pf-text-secondary">
        {categoryName(state, request.categoryId, locale)}
        {request.areaId ? ` · ${areaName(state, request.areaId, locale)}` : ""}
      </p>
      {preferredDateKey(request.preferredDate) ? (
        <p className="text-pf-16 text-pf-ink">{t(preferredDateKey(request.preferredDate)!)}</p>
      ) : request.preferredDate && /^\d{4}-\d{2}-\d{2}/.test(request.preferredDate) ? (
        <p className="text-pf-16 text-pf-ink">{formatLongDateLocalized(parseISO(request.preferredDate.slice(0, 10)), locale)}</p>
      ) : null}
      {request.preferredTime ? (
        <p className="text-pf-16 text-pf-ink">
          {preferredTimeKey(request.preferredTime) ? t(preferredTimeKey(request.preferredTime)!) : request.preferredTime}
        </p>
      ) : null}
      {done ? <p className="text-pf-14 font-medium text-pf-ink">{done}</p> : null}
      {offer.status !== "pending" || done ? null : (
        <div className="space-y-2">
          <div>
            <Label>{t("price")}</Label>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>{t("currency")}</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </div>
          <div>
            <Label>{t("message")}</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
          </div>
          <div>
            <Label>{t("proposedTime")}</Label>
            <Input value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          {error ? <p className="text-pf-14 font-medium text-pf-danger-ink">{error}</p> : null}
          <Button type="button" className="min-h-12 w-full" reflectGlobalBusy={false} onClick={() => send("quote")}>
            {t("sendQuote")}
          </Button>
          <Button type="button" variant="ghost" className="min-h-12 w-full" reflectGlobalBusy={false} onClick={() => send("time")}>
            {t("proposedTime")}
          </Button>
          <Button type="button" variant="danger" className="min-h-12 w-full" reflectGlobalBusy={false} onClick={() => send("decline")}>
            {t("decline")}
          </Button>
        </div>
      )}
    </div>
  );
}
