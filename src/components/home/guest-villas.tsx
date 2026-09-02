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
import { activeAcceptedRequestForVilla, confirmedQuoteForVilla } from "@/lib/guest/stay-date-request";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { todayIsoDate } from "@/lib/villas/status-from-dates";

type GuestConfirm =
  | { kind: "cancel-request"; requestId: string }
  | { kind: "decline-quote"; requestId: string };

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
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [confirm, setConfirm] = useState<GuestConfirm | null>(null);

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
      });
      setOk(t("guest.requestSent"));
      setRequestFor(null);
      setCheckIn("");
      setCheckOut("");
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    }
  };

  const confirmQuote = async (requestId: string) => {
    setQuoteBusy(true);
    setError(null);
    setOk(null);
    try {
      await data.confirmStayDateRequest(requestId);
      setOk(t("guest.quoteConfirmed"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setQuoteBusy(false);
    }
  };

  const declineQuote = (requestId: string) => {
    setConfirm({ kind: "decline-quote", requestId });
  };

  const cancelPending = (requestId: string) => {
    setConfirm({ kind: "cancel-request", requestId });
  };

  const runConfirmedAction = async () => {
    if (!confirm) return;
    setQuoteBusy(true);
    setError(null);
    setOk(null);
    try {
      await data.cancelStayDateRequest(confirm.requestId);
      setOk(t("guest.requestCancelled"));
      setConfirm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setQuoteBusy(false);
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
      <ConfirmDialog
        open={confirm?.kind === "cancel-request"}
        title={t("guest.requestCancelTitle")}
        description={t("guest.requestCancelConfirm")}
        confirmLabel={t("guest.requestCancel")}
        busy={quoteBusy}
        onConfirm={() => void runConfirmedAction()}
        onClose={() => {
          if (!quoteBusy) setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm?.kind === "decline-quote"}
        title={t("guest.quoteDeclineTitle")}
        description={t("guest.quoteDeclineConfirm")}
        confirmLabel={t("guest.quoteDecline")}
        busy={quoteBusy}
        onConfirm={() => void runConfirmedAction()}
        onClose={() => {
          if (!quoteBusy) setConfirm(null);
        }}
      />
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
          const quoted = data.stayDateRequests.find(
            (r) => r.villa_id === v.id && r.status === "quoted",
          );
          const accepted = confirmedQuoteForVilla(
            data.stayDateRequests,
            data.guestStays,
            v.id,
            data.profile?.id,
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

                {quoted ? (
                  <StayQuoteCard
                    request={quoted}
                    busy={quoteBusy}
                    onConfirm={() => void confirmQuote(quoted.id)}
                    onDecline={() => declineQuote(quoted.id)}
                  />
                ) : pending ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted">
                      {t("guest.requestPending", {
                        from: pending.check_in,
                        to: pending.check_out,
                      })}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-full"
                      disabled={quoteBusy}
                      onClick={() => cancelPending(pending.id)}
                    >
                      {t("guest.requestCancel")}
                    </Button>
                  </div>
                ) : accepted ? (
                  <div className="space-y-2">
                    <StayQuoteCard
                      request={accepted}
                      deposit={data.guestDeposits.find((d) => {
                        const stay = data.guestStays.find(
                          (s) =>
                            s.id === d.stay_id &&
                            s.villa_id === v.id &&
                            s.guest_profile_id === data.profile?.id,
                        );
                        return !!stay;
                      })}
                    />
                    {!data.guestStays.some(
                      (s) =>
                        s.villa_id === v.id &&
                        s.guest_profile_id === data.profile?.id &&
                        (s.status === "upcoming" || s.status === "active"),
                    ) ? (
                      <Button
                        type="button"
                        disabled={quoteBusy}
                        onClick={() => void confirmQuote(accepted.id)}
                      >
                        {t("guest.quoteConfirm")}
                      </Button>
                    ) : null}
                  </div>
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
