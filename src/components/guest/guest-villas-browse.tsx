"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DateField } from "@/components/ui/date-field";
import { StatusPill } from "@/components/ui/status-pill";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StayQuoteCard } from "@/components/guest/stay-quote-card";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import { formatShortDate } from "@/lib/utils";
import { isConfirmedStayStatus } from "@/lib/guest/confirmed-stay";
import { confirmedQuoteForVilla } from "@/lib/guest/stay-date-request";
import { todayIsoDate } from "@/lib/villas/status-from-dates";
import type { VillaListItem } from "@/lib/types";

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

/** Browse company properties and request stay dates. */
export function GuestVillasBrowse({
  villas,
  showHostLabel = false,
}: {
  villas?: VillaListItem[];
  /** When true, show "Hosted by …" above the list (single-company sections omit this). */
  showHostLabel?: boolean;
}) {
  const data = useData();
  const { t } = useI18n();
  const list =
    villas ?? data.villaList.filter((v) => v.bucket === "company");
  const minDate = todayIsoDate();
  const [requestFor, setRequestFor] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [confirm, setConfirm] = useState<GuestConfirm | null>(null);

  const hostLabel = useMemo(() => {
    if (!showHostLabel || !list.length) return null;
    return list[0]?.orgLabel ?? null;
  }, [list, showHostLabel]);

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

  if (!list.length) {
    return <p className="text-sm text-muted">{t("guest.villasEmpty")}</p>;
  }

  return (
    <div className="space-y-3">
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
      {hostLabel ? (
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          {t("guest.villasHost", { name: hostLabel })}
        </p>
      ) : null}
      {ok ? <p className="text-sm font-semibold text-secondary">{ok}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {list.map((v) => {
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
        const activeStayForVilla = data.guestStays.find(
          (s) =>
            s.villa_id === v.id &&
            s.guest_profile_id === data.profile?.id &&
            isConfirmedStayStatus(s.status),
        );
        return (
          <Card key={v.id} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-base font-bold text-ink">
                {v.name}
              </p>
              <StatusPill status={v.status} />
            </div>
            {v.area ? <p className="text-sm text-muted">{v.area}</p> : null}
            {quoted ? (
              <StayQuoteCard
                request={quoted}
                busy={quoteBusy}
                onConfirm={() => void confirmQuote(quoted.id)}
                onDecline={() =>
                  setConfirm({ kind: "decline-quote", requestId: quoted.id })
                }
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
                  onClick={() =>
                    setConfirm({
                      kind: "cancel-request",
                      requestId: pending.id,
                    })
                  }
                >
                  {t("guest.requestCancel")}
                </Button>
              </div>
            ) : activeStayForVilla ? (
              <p className="text-sm font-semibold text-secondary">
                {t("guest.currentStayDates", {
                  from: formatShortDate(activeStayForVilla.check_in),
                  to: formatShortDate(activeStayForVilla.check_out),
                })}
              </p>
            ) : accepted ? (
              <Button
                type="button"
                disabled={quoteBusy}
                onClick={() => void confirmQuote(accepted.id)}
              >
                {t("guest.quoteConfirm")}
              </Button>
            ) : requestFor === v.id ? (
              <div className="space-y-2 rounded-2xl bg-white/60 p-3 ring-1 ring-black/5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`in-${v.id}`}>{t("guest.checkIn")}</Label>
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
                    <Label htmlFor={`out-${v.id}`}>{t("guest.checkOut")}</Label>
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
                  <Label htmlFor={`note-${v.id}`}>{t("guest.requestNote")}</Label>
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
          </Card>
        );
      })}
    </div>
  );
}
