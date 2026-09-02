"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { formatMoney, formatShortDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import {
  BILL_CURRENCIES,
  billCurrencyLabel,
  DEFAULT_BILL_CURRENCY,
  normalizeBillCurrency,
  type BillCurrency,
} from "@/lib/billing/currencies";
import type { DepositTiming } from "@/lib/types";

export default function DateRequestsPage() {
  const data = useData();
  const { t } = useI18n();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acceptFor, setAcceptFor] = useState<string | null>(null);
  const [quotedPrice, setQuotedPrice] = useState("");
  const [quotedCurrency, setQuotedCurrency] = useState<BillCurrency>(
    DEFAULT_BILL_CURRENCY,
  );
  const [depositAmount, setDepositAmount] = useState("");
  const [depositTiming, setDepositTiming] =
    useState<DepositTiming>("before_arrival");
  const [paymentNote, setPaymentNote] = useState("");

  const canRespond =
    data.profile?.role === "owner" || data.profile?.role === "manager";

  const pending = useMemo(
    () =>
      data.stayDateRequests
        .filter((r) => r.status === "pending")
        .sort(
          (a, b) =>
            +new Date(b.created_at) - +new Date(a.created_at),
        ),
    [data.stayDateRequests],
  );

  const handled = useMemo(
    () =>
      data.stayDateRequests
        .filter((r) => r.status === "accepted" || r.status === "declined")
        .sort(
          (a, b) =>
            +new Date(b.created_at) - +new Date(a.created_at),
        )
        .slice(0, 8),
    [data.stayDateRequests],
  );

  const awaitingGuest = useMemo(
    () =>
      data.stayDateRequests
        .filter((r) => r.status === "quoted")
        .sort(
          (a, b) =>
            +new Date(b.created_at) - +new Date(a.created_at),
        ),
    [data.stayDateRequests],
  );

  useEffect(() => {
    if (!data.ready || !data.profile) return;
    if (!canRespond) router.replace("/home");
  }, [data.ready, data.profile, canRespond, router]);

  if (!data.ready || !data.profile) return <LoadingState />;
  if (!canRespond) return <LoadingState />;

  const openAccept = (requestId: string) => {
    setAcceptFor(requestId);
    setError(null);
    setQuotedPrice("");
    setQuotedCurrency(DEFAULT_BILL_CURRENCY);
    setDepositAmount("");
    setDepositTiming("before_arrival");
    setPaymentNote("");
  };

  const respond = async (
    requestId: string,
    decision: "quoted" | "declined",
  ) => {
    setBusyId(requestId);
    setError(null);
    try {
      if (decision === "quoted") {
        const amount = Number(quotedPrice);
        if (!Number.isFinite(amount) || amount <= 0) {
          setError(t("dateRequests.priceRequired"));
          return;
        }
        await data.respondStayDateRequest(requestId, decision, {
          quoted_price_amount: amount,
          quoted_price_currency: quotedCurrency,
          quoted_deposit_amount: depositAmount.trim()
            ? Number(depositAmount)
            : null,
          quoted_deposit_currency: depositAmount.trim()
            ? quotedCurrency
            : null,
          quoted_deposit_timing: depositAmount.trim() ? depositTiming : null,
          payment_note: paymentNote,
        });
        setAcceptFor(null);
      } else {
        await data.respondStayDateRequest(requestId, decision);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4 animate-rise">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("dateRequests.title")}
        </h1>
        <p className="text-sm text-muted">{t("dateRequests.subtitle")}</p>
        <p className="mt-2 text-xs text-muted">{t("dateRequests.depositHint")}</p>
      </div>

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      {!pending.length ? (
        <EmptyState
          title={t("dateRequests.empty")}
          description={t("dateRequests.emptyHint")}
        />
      ) : (
        <ul className="space-y-3">
          {pending.map((r) => {
            const guest = data.profiles.find(
              (p) => p.id === r.guest_profile_id,
            );
            const villa =
              data.allOrgVillas.find((v) => v.id === r.villa_id) ??
              data.villas.find((v) => v.id === r.villa_id);
            const showingAccept = acceptFor === r.id;
            return (
              <li key={r.id}>
                <Card className="space-y-3 p-4">
                  <div>
                    <p className="font-display text-lg font-bold text-ink">
                      {villa?.name ?? t("dateRequests.unknownVilla")}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {guest?.full_name ?? t("roles.guest")}
                      {" · "}
                      {formatShortDate(r.check_in)} →{" "}
                      {formatShortDate(r.check_out)}
                    </p>
                    {r.note ? (
                      <p className="mt-2 text-sm text-ink">
                        <LocalizedText text={r.note} />
                      </p>
                    ) : null}
                  </div>

                  {showingAccept ? (
                    <div className="space-y-3 rounded-2xl bg-[#F7F5F1] p-3">
                      <p className="text-sm font-bold text-ink">
                        {t("dateRequests.confirmPrice")}
                      </p>
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <div>
                          <Label>{t("dateRequests.totalPrice")}</Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            value={quotedPrice}
                            onChange={(e) => setQuotedPrice(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>{t("bills.currency")}</Label>
                          <Select
                            value={quotedCurrency}
                            onChange={(e) =>
                              setQuotedCurrency(
                                normalizeBillCurrency(e.target.value),
                              )
                            }
                            className="min-w-[6.5rem]"
                          >
                            {BILL_CURRENCIES.map((code) => (
                              <option key={code} value={code}>
                                {billCurrencyLabel(code)}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <Label>{t("dateRequests.depositAmount")}</Label>
                          <p className="mb-1 text-xs text-muted">
                            {t("dateRequests.depositAmountHint")}
                          </p>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder={t("dateRequests.depositAmountPh")}
                          />
                        </div>
                        <div className="flex flex-col justify-end">
                          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
                            {t("bills.currency")}
                          </p>
                          <p className="rounded-2xl bg-white px-3 py-3 text-sm font-semibold text-ink">
                            {billCurrencyLabel(quotedCurrency)}
                          </p>
                        </div>
                        {depositAmount.trim() ? (
                          <div className="col-span-2 space-y-2">
                            <Label>{t("dateRequests.depositWhen")}</Label>
                            <div className="flex flex-wrap gap-2">
                              {(
                                [
                                  "before_arrival",
                                  "on_arrival",
                                ] as DepositTiming[]
                              ).map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => setDepositTiming(value)}
                                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                    depositTiming === value
                                      ? "bg-primary text-white"
                                      : "bg-white text-ink"
                                  }`}
                                >
                                  {t(`guest.depositTiming.${value}`)}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div>
                        <Label>{t("dateRequests.paymentNote")}</Label>
                        <Textarea
                          value={paymentNote}
                          onChange={(e) => setPaymentNote(e.target.value)}
                          placeholder={t("dateRequests.paymentNotePh")}
                          rows={3}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => void respond(r.id, "quoted")}
                        >
                          {t("dateRequests.sendQuote")}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setAcceptFor(null)}
                        >
                          {t("common.cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => openAccept(r.id)}
                      >
                        {t("dateRequests.sendQuote")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={busyId === r.id}
                        onClick={() => void respond(r.id, "declined")}
                      >
                        {t("dateRequests.decline")}
                      </Button>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {awaitingGuest.length ? (
        <div className="space-y-2">
          <h2 className="font-display text-base font-bold text-ink">
            {t("dateRequests.awaitingGuest")}
          </h2>
          <ul className="space-y-2">
            {awaitingGuest.map((r) => {
              const guest = data.profiles.find(
                (p) => p.id === r.guest_profile_id,
              );
              const villa =
                data.allOrgVillas.find((v) => v.id === r.villa_id) ??
                data.villas.find((v) => v.id === r.villa_id);
              return (
                <li key={r.id}>
                  <Card className="px-4 py-3 text-sm">
                    <p className="font-semibold text-ink">
                      {villa?.name ?? t("dateRequests.unknownVilla")}
                    </p>
                    <p className="text-muted">
                      {guest?.full_name ?? t("roles.guest")}
                      {" · "}
                      {formatShortDate(r.check_in)} →{" "}
                      {formatShortDate(r.check_out)}
                    </p>
                    {r.quoted_price_amount && r.quoted_price_currency ? (
                      <p className="mt-1 font-semibold text-ink">
                        {formatMoney(
                          Number(r.quoted_price_amount),
                          r.quoted_price_currency,
                        )}
                        {r.quoted_deposit_amount && r.quoted_deposit_currency ? (
                          <>
                            {" · "}
                            {t("dateRequests.depositQuoted", {
                              amount: formatMoney(
                                Number(r.quoted_deposit_amount),
                                r.quoted_deposit_currency,
                              ),
                            })}
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {handled.length ? (
        <div className="space-y-2">
          <h2 className="font-display text-base font-bold text-ink">
            {t("dateRequests.recent")}
          </h2>
          <ul className="space-y-2">
            {handled.map((r) => {
              const guest = data.profiles.find(
                (p) => p.id === r.guest_profile_id,
              );
              const villa =
                data.allOrgVillas.find((v) => v.id === r.villa_id) ??
                data.villas.find((v) => v.id === r.villa_id);
              return (
                <li key={r.id}>
                  <Card className="px-4 py-3 text-sm">
                    <p className="font-semibold text-ink">
                      {villa?.name ?? t("dateRequests.unknownVilla")}
                    </p>
                    <p className="text-muted">
                      {guest?.full_name ?? t("roles.guest")}
                      {" · "}
                      {formatShortDate(r.check_in)} →{" "}
                      {formatShortDate(r.check_out)}
                      {" · "}
                      <span className="capitalize">{r.status}</span>
                    </p>
                    {r.status === "accepted" &&
                    r.quoted_price_amount &&
                    r.quoted_price_currency ? (
                      <p className="mt-1 font-semibold text-ink">
                        {formatMoney(
                          Number(r.quoted_price_amount),
                          r.quoted_price_currency,
                        )}
                        {r.quoted_deposit_amount && r.quoted_deposit_currency ? (
                          <>
                            {" · "}
                            {t("dateRequests.depositQuoted", {
                              amount: formatMoney(
                                Number(r.quoted_deposit_amount),
                                r.quoted_deposit_currency,
                              ),
                            })}
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
          <Link
            href="/guests"
            className="inline-block text-sm font-bold text-primary"
          >
            {t("guests.title")} →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
