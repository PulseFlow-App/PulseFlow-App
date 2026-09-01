"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DateField } from "@/components/ui/date-field";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { VillaPhotoThumb } from "@/components/villas/villa-photo";
import { StayQuoteCard } from "@/components/guest/stay-quote-card";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import {
  BILL_CURRENCIES,
  billCurrencyLabel,
  DEFAULT_BILL_CURRENCY,
  normalizeBillCurrency,
  type BillCurrency,
} from "@/lib/billing/currencies";
import { formatMoney } from "@/lib/utils";
import { todayIsoDate } from "@/lib/villas/status-from-dates";

function nextDayIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function GuestVillasBrowse() {
  const data = useData();
  const { t } = useI18n();
  const villas = data.villaList.filter((v) => v.bucket === "company");
  const minDate = todayIsoDate();
  const [requestFor, setRequestFor] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [note, setNote] = useState("");
  const [priceAmount, setPriceAmount] = useState("");
  const [priceCurrency, setPriceCurrency] = useState<BillCurrency>(
    DEFAULT_BILL_CURRENCY,
  );
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const checkOutMin =
    checkIn && checkIn >= minDate ? nextDayIso(checkIn) : nextDayIso(minDate);

  const setSafeCheckIn = (value: string) => {
    if (value && value < minDate) {
      setCheckIn("");
      setError(t("guest.requestPastDates"));
      return;
    }
    setError(null);
    setCheckIn(value);
    if (checkOut && value && checkOut <= value) setCheckOut("");
  };

  const setSafeCheckOut = (value: string) => {
    if (value && value < checkOutMin) {
      setCheckOut("");
      setError(t("guest.requestCheckoutAfter"));
      return;
    }
    setError(null);
    setCheckOut(value);
  };

  const submit = async (villaId: string) => {
    setError(null);
    setOk(null);
    if (!checkIn || !checkOut) {
      setError(t("guest.requestNeedDates"));
      return;
    }
    if (checkIn < minDate) {
      setError(t("guest.requestPastDates"));
      return;
    }
    if (checkOut <= checkIn) {
      setError(t("guest.requestCheckoutAfter"));
      return;
    }
    try {
      await data.requestStayDates({
        villa_id: villaId,
        check_in: checkIn,
        check_out: checkOut,
        note,
        guest_price_amount: priceAmount ? Number(priceAmount) : null,
        guest_price_currency: priceAmount ? priceCurrency : null,
      });
      setOk(t("guest.requestSent"));
      setRequestFor(null);
      setCheckIn("");
      setCheckOut("");
      setNote("");
      setPriceAmount("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    }
  };

  if (!villas.length) {
    return (
      <EmptyState
        title={t("guest.villasTitle")}
        description={t("guest.villasEmpty")}
      />
    );
  }

  return (
    <div className="space-y-4 animate-rise">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("guest.villasTitle")}
        </h1>
        {data.orgName ? (
          <p className="text-sm font-semibold text-ink">
            {t("guest.villasHost", { name: data.orgName })}
          </p>
        ) : null}
        <p className="text-sm text-muted">{t("guest.villasHint")}</p>
      </div>

      {ok ? <p className="text-sm font-semibold text-secondary">{ok}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="space-y-3">
        {villas.map((v) => {
          const pending = data.stayDateRequests.find(
            (r) => r.villa_id === v.id && r.status === "pending",
          );
          const accepted = data.stayDateRequests.find(
            (r) =>
              r.villa_id === v.id &&
              r.status === "accepted" &&
              r.quoted_price_amount != null,
          );
          return (
            <Card key={v.id} className="space-y-3 overflow-hidden p-0">
              <VillaPhotoThumb
                src={v.photo_url}
                alt={v.name}
                className="rounded-none rounded-t-[1.5rem]"
              />
              <div className="space-y-3 px-4 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-lg font-bold text-ink">
                    {v.name}
                  </p>
                  <StatusPill status={v.status} />
                </div>
                {v.area ? (
                  <p className="flex items-center gap-1 text-sm text-muted">
                    <MapPin className="size-3.5" />
                    {v.area}
                  </p>
                ) : null}
                {v.description ? (
                  <p className="text-sm text-muted">
                    <LocalizedText text={v.description} />
                  </p>
                ) : null}

                {pending ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted">
                      {t("guest.requestPending", {
                        from: pending.check_in,
                        to: pending.check_out,
                      })}
                    </p>
                    {pending.guest_price_amount && pending.guest_price_currency ? (
                      <p className="text-sm font-semibold text-ink">
                        {t("guest.requestPendingPrice", {
                          amount: formatMoney(
                            Number(pending.guest_price_amount),
                            pending.guest_price_currency,
                          ),
                        })}
                      </p>
                    ) : null}
                  </div>
                ) : accepted ? (
                  <StayQuoteCard request={accepted} />
                ) : requestFor === v.id ? (
                  <div className="space-y-2 rounded-2xl bg-white/60 p-3 ring-1 ring-black/5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`in-${v.id}`}>
                          {t("guest.checkIn")}
                        </Label>
                        <DateField
                          id={`in-${v.id}`}
                          value={checkIn}
                          min={minDate}
                          onChange={setSafeCheckIn}
                          placeholder={t("guest.checkIn")}
                          aria-label={t("guest.checkIn")}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`out-${v.id}`}>
                          {t("guest.checkOut")}
                        </Label>
                        <DateField
                          id={`out-${v.id}`}
                          value={checkOut}
                          min={checkOutMin}
                          onChange={setSafeCheckOut}
                          placeholder={t("guest.checkOut")}
                          aria-label={t("guest.checkOut")}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`note-${v.id}`}>
                        {t("guest.requestNote")}
                      </Label>
                      <Input
                        id={`note-${v.id}`}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t("guest.requestNotePh")}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`price-${v.id}`}>
                        {t("guest.requestPrice")}
                      </Label>
                      <p className="mb-1 text-xs text-muted">
                        {t("guest.requestPriceHint")}
                      </p>
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <Input
                          id={`price-${v.id}`}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          value={priceAmount}
                          onChange={(e) => setPriceAmount(e.target.value)}
                          placeholder={t("guest.requestPricePh")}
                        />
                        <select
                          value={priceCurrency}
                          onChange={(e) =>
                            setPriceCurrency(
                              normalizeBillCurrency(e.target.value),
                            )
                          }
                          className="rounded-2xl border-0 bg-[#F7F5F1] px-3 py-3 text-sm font-semibold text-ink"
                          aria-label={t("bills.currency")}
                        >
                          {BILL_CURRENCIES.map((code) => (
                            <option key={code} value={code}>
                              {billCurrencyLabel(code)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={() => void submit(v.id)}>
                        {t("guest.sendRequest")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setRequestFor(null)}
                      >
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => {
                      setRequestFor(v.id);
                      setCheckIn("");
                      setCheckOut("");
                      setNote("");
                      setPriceAmount("");
                      setError(null);
                    }}
                  >
                    {t("guest.requestDates")}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
