"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OriginalText, RequireUser } from "@/components/pros/parts";
import { ServiceReviewForm } from "@/components/pros/service-review";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { assignRequestToTask } from "@/lib/pros/assign-task";
import { preferredDateKey, statusKey } from "@/lib/pros/i18n";
import { nextKey, offerHasReply } from "@/lib/pros/matching";
import { usePros } from "@/lib/pros/store";
import { formatLongDateLocalized } from "@/lib/i18n/date-format";
import { useI18n } from "@/lib/i18n/provider";
import { parseISO } from "date-fns";
import { lineDeepLink } from "@/lib/utils";
import type { ProOffer, ProProfile, ProsStatus } from "@/lib/pros/types";

function replyText(title: string, url: string) {
  return `${title}\n${url}`;
}

function channels(pro: ProProfile, text: string) {
  const rows: { href: string; key: "openWhatsApp" | "openLine" | "openSms" }[] = [];
  const phone = (pro.whatsapp || pro.phone || "").replace(/\D/g, "");
  if (phone && (pro.whatsapp || pro.phone)) {
    rows.push({ href: `https://wa.me/${phone}?text=${encodeURIComponent(text)}`, key: "openWhatsApp" });
  }
  if (pro.lineId) rows.push({ href: lineDeepLink(pro.lineId), key: "openLine" });
  if (pro.phone) {
    rows.push({
      href: `sms:${pro.phone.replace(/\D/g, "")}?&body=${encodeURIComponent(text)}`,
      key: "openSms",
    });
  }
  return rows;
}

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const { state, actor, t, chooseOffer, setRequestStatus, rememberTranslation, recordCost } = usePros();
  const { locale } = useI18n();
  const request = state.requests.find((row) => row.id === params.id);
  const [assigned, setAssigned] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [finalAmount, setFinalAmount] = useState("");
  const [finalCurrency, setFinalCurrency] = useState("");
  const [origin, setOrigin] = useState("https://services.pulseflow.site");
  useEffect(() => setOrigin(window.location.origin), []);
  if (!request) {
    return (
      <RequireUser>
        <p className="text-sm text-muted">{t("emptyRequests")}</p>
      </RequireUser>
    );
  }
  const offers = state.offers.filter((row) => row.requestId === request.id);
  const visible = offers.filter(offerHasReply);
  const mine = actor?.id === request.createdBy;
  const chosen = state.profiles.find((row) => row.id === request.chosenProfileId) ?? null;
  const reviewed = state.reviews.some((row) => row.requestId === request.id);

  const advance = (status: ProsStatus) => () => setRequestStatus(request.id, status);

  return (
    <RequireUser>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t(statusKey(request.status))}</p>
          <h1 className="font-display text-2xl font-semibold text-ink">{request.title}</h1>
          <p className="mt-1 text-sm text-ink">{t(nextKey(request.status))}</p>
          {preferredDateKey(request.preferredDate) ? (
            <p className="mt-1 text-sm text-ink">{t(preferredDateKey(request.preferredDate)!)}</p>
          ) : request.preferredDate && /^\d{4}-\d{2}-\d{2}/.test(request.preferredDate) ? (
            <p className="mt-1 text-sm text-ink">{formatLongDateLocalized(parseISO(request.preferredDate.slice(0, 10)), locale)}</p>
          ) : null}
          {request.preferredTime ? <p className="text-sm text-muted">{request.preferredTime}</p> : null}
        </div>
        <OriginalText
          text={request.description}
          locale={request.originalLocale}
          translations={request.translations}
          onSave={(lang, text) => rememberTranslation("request", request.id, lang, text)}
        />
        {request.taskId ? <p className="text-sm text-muted">{t("fromTask")}</p> : null}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">{t("matches")}</h2>
          <p className="text-xs text-muted">{t("replyHint")}</p>
          {offers.length === 0 ? <p className="text-sm text-muted">{t("noMatches")}</p> : null}
          {offers.map((offer) => {
            const pro = state.profiles.find((row) => row.id === offer.profileId);
            if (!pro) return null;
            const url = `${origin}${origin.includes("services.") || origin.includes("pros.") ? "" : "/pros"}/reply/${offer.token}`;
            const text = replyText(request.title, url);
            return (
              <div key={offer.id} className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-card p-3">
                <p className="font-semibold text-ink">{pro.name}</p>
                <p className="break-all text-xs text-muted">{url}</p>
                <div className="flex flex-wrap gap-2">
                  {channels(pro, text).map((row) => (
                    <a key={row.key} href={row.href} className="inline-flex min-h-12 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white">
                      {t(row.key)}
                    </a>
                  ))}
                  <button
                    type="button"
                    className="inline-flex min-h-12 items-center rounded-full border border-[var(--color-border)] px-4 text-sm font-semibold"
                    onClick={() => {
                      void navigator.clipboard.writeText(url);
                      setCopied(offer.id);
                    }}
                  >
                    {copied === offer.id ? t("copied") : t("copyLink")}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">{t("offers")}</h2>
          {visible.length === 0 ? <p className="text-sm text-muted">{t("noOffers")}</p> : null}
          {visible.map((offer: ProOffer) => {
            const pro = state.profiles.find((row) => row.id === offer.profileId);
            return (
              <article key={offer.id} className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-card p-3">
                <p className="font-semibold text-ink">{pro?.name}</p>
                {offer.status === "declined" ? <p className="text-sm text-muted">{t("decline")}</p> : null}
                {offer.amount != null ? (
                  <p className="text-sm text-ink">
                    {offer.amount} {offer.currency ?? ""}
                  </p>
                ) : null}
                {offer.proposedTime ? <p className="text-sm text-ink">{offer.proposedTime}</p> : null}
                {offer.message ? (
                  <OriginalText
                    text={offer.message}
                    locale={offer.originalLocale}
                    translations={offer.translations}
                    onSave={(lang, text) => rememberTranslation("offer", offer.id, lang, text)}
                  />
                ) : null}
                {mine && request.status !== "cancelled" && request.status !== "completed" && offer.status === "pending" && offerHasReply(offer) ? (
                  <Button type="button" className="min-h-12" reflectGlobalBusy={false} onClick={() => chooseOffer(offer.id)}>
                    {t("choose")}
                  </Button>
                ) : null}
              </article>
            );
          })}
        </section>
        {mine && chosen ? (
          <section className="space-y-2">
            {offers.find((row) => row.status === "accepted" && row.amount != null) ? (
              <p className="text-sm text-ink">
                {t("agreedPrice")}: {offers.find((row) => row.status === "accepted")?.amount}{" "}
                {offers.find((row) => row.status === "accepted")?.currency ?? ""}
              </p>
            ) : null}
            {request.paidAt ? (
              <p className="text-sm text-ink">{t("paidDirect")}</p>
            ) : (
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const amount = finalAmount.trim() ? Number(finalAmount) : request.finalAmount;
                  recordCost(request.id, {
                    amount: amount != null && Number.isFinite(amount) ? amount : null,
                    currency: finalCurrency.trim() || request.finalCurrency,
                    paid: true,
                  });
                }}
              >
                <Label>{t("finalPrice")}</Label>
                <Input inputMode="decimal" value={finalAmount} onChange={(e) => setFinalAmount(e.target.value)} className="min-h-12" placeholder={request.finalAmount?.toString() ?? ""} />
                <Input value={finalCurrency} onChange={(e) => setFinalCurrency(e.target.value)} className="min-h-12" placeholder={t("currency")} aria-label={t("currency")} />
                <Button type="submit" variant="ghost" className="min-h-12 w-full" reflectGlobalBusy={false}>
                  {t("markPaid")}
                </Button>
              </form>
            )}
          </section>
        ) : null}
        {mine && chosen && request.taskId && request.status !== "cancelled" ? (
          <Button
            type="button"
            variant="secondary"
            className="min-h-12 w-full"
            reflectGlobalBusy={false}
            onClick={() => {
              void assignRequestToTask({
                request,
                professionalName: chosen.name,
                assigneeProfileId: chosen.linkedProfileId,
              }).then((result) => {
                if (result.ok) setAssigned(true);
              });
            }}
          >
            {assigned ? t("assigned") : t("assign")}
          </Button>
        ) : null}
        {mine && request.status !== "cancelled" && request.status !== "completed" ? (
          <div className="flex flex-col gap-2">
            {request.status === "chosen" ? (
              <Button type="button" variant="ghost" className="min-h-12" reflectGlobalBusy={false} onClick={advance("scheduled")}>
                {t("markScheduled")}
              </Button>
            ) : null}
            {request.status === "scheduled" ? (
              <Button type="button" variant="ghost" className="min-h-12" reflectGlobalBusy={false} onClick={advance("in_progress")}>
                {t("markProgress")}
              </Button>
            ) : null}
            {request.status === "in_progress" ? (
              <Button type="button" variant="ghost" className="min-h-12" reflectGlobalBusy={false} onClick={advance("awaiting_approval")}>
                {t("markApproval")}
              </Button>
            ) : null}
            {request.status === "awaiting_approval" ? (
              <Button type="button" className="min-h-12" reflectGlobalBusy={false} onClick={advance("completed")}>
                {t("approveWork")}
              </Button>
            ) : null}
            <Button type="button" variant="danger" className="min-h-12" reflectGlobalBusy={false} onClick={advance("cancelled")}>
              {t("cancel")}
            </Button>
          </div>
        ) : null}
        {mine && request.status === "completed" && !reviewed ? (
          <ServiceReviewForm requestId={request.id} />
        ) : null}
      </div>
    </RequireUser>
  );
}
