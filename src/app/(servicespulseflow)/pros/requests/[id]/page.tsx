"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OriginalText, RequireUser } from "@/components/pros/parts";
import { ServiceReviewForm } from "@/components/pros/service-review";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { assignRequestToTask } from "@/lib/pros/assign-task";
import { preferredDateKey, preferredTimeKey, statusKey } from "@/lib/pros/i18n";
import { nextKey, offerHasReply } from "@/lib/pros/matching";
import type { ServiceDelivery } from "@/lib/pros/delivery";
import { usePros } from "@/lib/pros/store";
import { formatLongDateLocalized } from "@/lib/i18n/date-format";
import { useI18n } from "@/lib/i18n/provider";
import { parseISO } from "date-fns";
import type { ProOffer, ProsStatus } from "@/lib/pros/types";

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const { state, actor, t, chooseOffer, setRequestStatus, rememberTranslation, recordCost } = usePros();
  const { locale } = useI18n();
  const request = state.requests.find((row) => row.id === params.id);
  const [assigned, setAssigned] = useState(false);
  const [finalAmount, setFinalAmount] = useState("");
  const [finalCurrency, setFinalCurrency] = useState("");
  const [deliveries, setDeliveries] = useState<ServiceDelivery[]>([]);
  useEffect(() => {
    let cancel = false;
    void fetch("/api/services/requests")
      .then((res) => (res.ok ? res.json() : { requests: [] }))
      .then((payload: { requests?: ServiceDelivery[] }) => {
        if (!cancel) setDeliveries(payload.requests ?? []);
      })
      .catch(() => {
        if (!cancel) setDeliveries([]);
      });
    return () => {
      cancel = true;
    };
  }, [params.id]);
  if (!request) {
    return (
      <RequireUser>
        <p className="text-pf-14 text-pf-text-secondary">{t("emptyRequests")}</p>
      </RequireUser>
    );
  }
  const offers = state.offers.filter((row) => row.requestId === request.id);
  const remote = deliveries.filter((row) => row.request_id === request.id);
  const replyFor = (profileId: string) => {
    const linked = state.profiles.find((row) => row.id === profileId)?.linkedProfileId;
    if (!linked) return null;
    return remote.find((row) => row.target_profile_id === linked && row.reply_message) ?? null;
  };
  const visible = offers.filter((offer) => offerHasReply(offer) || replyFor(offer.profileId));
  const mine = actor?.id === request.createdBy;
  const chosen = state.profiles.find((row) => row.id === request.chosenProfileId) ?? null;
  const reviewed = state.reviews.some((row) => row.requestId === request.id);

  const advance = (status: ProsStatus) => () => setRequestStatus(request.id, status);

  return (
    <RequireUser>
      <div className="space-y-3">
        <section className="rounded-[20px] border border-pf-line bg-pf-card p-4">
          <p className="text-pf-12 font-medium text-pf-slate-ink">{t(statusKey(request.status))}</p>
          <h1 className="mt-1 text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{request.title}</h1>
          <p className="mt-2 text-pf-16 text-pf-text-secondary">{t(nextKey(request.status))}</p>
        </section>
        {preferredDateKey(request.preferredDate) || request.preferredDate || request.preferredTime ? (
          <section className="rounded-[20px] border border-pf-line bg-pf-card p-4">
            <h2 className="text-pf-12 font-medium text-pf-slate-ink">{t("whenLabel")}</h2>
            {preferredDateKey(request.preferredDate) ? (
              <p className="mt-2 text-pf-18 font-medium text-pf-ink">{t(preferredDateKey(request.preferredDate)!)}</p>
            ) : request.preferredDate && /^\d{4}-\d{2}-\d{2}/.test(request.preferredDate) ? (
              <p className="mt-2 text-pf-18 font-medium text-pf-ink">{formatLongDateLocalized(parseISO(request.preferredDate.slice(0, 10)), locale)}</p>
            ) : null}
            {request.preferredTime ? (
              <p className="mt-1 text-pf-16 text-pf-text-secondary">
                {preferredTimeKey(request.preferredTime) ? t(preferredTimeKey(request.preferredTime)!) : request.preferredTime}
              </p>
            ) : null}
          </section>
        ) : null}
        <section className="rounded-[20px] border border-pf-line bg-pf-card p-4">
          <h2 className="text-pf-12 font-medium text-pf-slate-ink">{t("about")}</h2>
          <div className="mt-2">
            <OriginalText
              text={request.description}
              locale={request.originalLocale}
              translations={request.translations}
              onSave={(lang, text) => rememberTranslation("request", request.id, lang, text)}
            />
          </div>
          {request.taskId ? <p className="mt-3 text-pf-14 text-pf-text-secondary">{t("fromTask")}</p> : null}
        </section>
        <section className="space-y-3 rounded-[20px] border border-pf-line bg-pf-card p-4">
          <h2 className="text-pf-12 font-medium text-pf-slate-ink">{t("asked")}</h2>
          {offers.length === 0 ? <p className="text-pf-16 text-pf-text-secondary">{t("noMatches")}</p> : null}
          {offers.map((offer) => {
            const pro = state.profiles.find((row) => row.id === offer.profileId);
            if (!pro) return null;
            return (
              <div key={offer.id}>
                <p className="text-pf-18 font-medium text-pf-ink">{t("sentTo", { name: pro.name })}</p>
                <p className="mt-1 text-pf-16 text-pf-text-secondary">
                  {pro.linkedProfileId ? t("notifiedInApp") : t("notOnApp")}
                </p>
              </div>
            );
          })}
        </section>
        <section className="space-y-3">
          <h2 className="text-pf-14 font-medium text-pf-ink">{t("offers")}</h2>
          {visible.length === 0 ? <p className="text-pf-14 text-pf-text-secondary">{t("noOffers")}</p> : null}
          {visible.map((offer: ProOffer) => {
            const pro = state.profiles.find((row) => row.id === offer.profileId);
            const remoteReply = replyFor(offer.profileId);
            const message = offer.message || remoteReply?.reply_message || "";
            return (
              <article key={offer.id} className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-3">
                <p className="font-medium text-pf-ink">{pro?.name}</p>
                {offer.status === "declined" ? <p className="text-pf-14 text-pf-text-secondary">{t("decline")}</p> : null}
                {offer.amount != null ? (
                  <p className="text-pf-16 text-pf-ink">
                    {offer.amount} {offer.currency ?? ""}
                  </p>
                ) : remoteReply?.reply_amount != null ? (
                  <p className="text-pf-16 text-pf-ink">
                    {remoteReply.reply_amount} {remoteReply.reply_currency ?? ""}
                  </p>
                ) : null}
                {offer.proposedTime ? <p className="text-pf-16 text-pf-ink">{offer.proposedTime}</p> : null}
                {message ? (
                  <OriginalText
                    text={message}
                    locale={offer.originalLocale}
                    translations={offer.translations}
                    onSave={(lang, text) => rememberTranslation("offer", offer.id, lang, text)}
                  />
                ) : null}
                {mine && request.status !== "cancelled" && request.status !== "completed" && offer.status === "pending" && (offerHasReply(offer) || remoteReply) ? (
                  <Button type="button" reflectGlobalBusy={false} onClick={() => chooseOffer(offer.id)}>
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
              <p className="text-pf-16 text-pf-ink">
                {t("agreedPrice")}: {offers.find((row) => row.status === "accepted")?.amount}{" "}
                {offers.find((row) => row.status === "accepted")?.currency ?? ""}
              </p>
            ) : null}
            {request.paidAt ? (
              <p className="text-pf-16 text-pf-ink">{t("paidDirect")}</p>
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
                <Input inputMode="decimal" value={finalAmount} onChange={(e) => setFinalAmount(e.target.value)} placeholder={request.finalAmount?.toString() ?? ""} />
                <Input value={finalCurrency} onChange={(e) => setFinalCurrency(e.target.value)} placeholder={t("currency")} aria-label={t("currency")} />
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
              <Button type="button" variant="ghost" reflectGlobalBusy={false} onClick={advance("scheduled")}>
                {t("markScheduled")}
              </Button>
            ) : null}
            {request.status === "scheduled" ? (
              <Button type="button" variant="ghost" reflectGlobalBusy={false} onClick={advance("in_progress")}>
                {t("markProgress")}
              </Button>
            ) : null}
            {request.status === "in_progress" ? (
              <Button type="button" variant="ghost" reflectGlobalBusy={false} onClick={advance("awaiting_approval")}>
                {t("markApproval")}
              </Button>
            ) : null}
            {request.status === "awaiting_approval" ? (
              <Button type="button" reflectGlobalBusy={false} onClick={advance("completed")}>
                {t("approveWork")}
              </Button>
            ) : null}
            <Button type="button" variant="danger" reflectGlobalBusy={false} onClick={advance("cancelled")}>
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
