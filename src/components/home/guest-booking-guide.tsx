"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, KeyRound, Wifi } from "lucide-react";
import { GuestVillaLocation } from "@/components/guest/guest-villa-location";
import { GuestBriefingsCard } from "@/components/guest/guest-briefings-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DateField } from "@/components/ui/date-field";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StayQuoteCard } from "@/components/guest/stay-quote-card";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import { formatShortDate } from "@/lib/utils";
import {
  canGuestSelfCancelStay,
  guestCancelBlockedReason,
} from "@/lib/guest/cancel-booking";
import { isConfirmedStayStatus, pickConfirmedStay } from "@/lib/guest/confirmed-stay";
import { confirmedQuoteForVilla } from "@/lib/guest/stay-date-request";
import {
  readSelectedStayId,
  writeSelectedStayId,
} from "@/lib/guest/selected-stay";
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

export function GuestBookingGuide() {
  const data = useData();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stayParam = searchParams.get("stay");

  const confirmedBookings = useMemo(
    () =>
      data.guestStays
        .filter((s) => isConfirmedStayStatus(s.status))
        .sort((a, b) => +new Date(a.check_in) - +new Date(b.check_in)),
    [data.guestStays],
  );

  const selectedStay = useMemo(() => {
    if (stayParam) {
      return (
        confirmedBookings.find((s) => s.id === stayParam) ??
        data.guestStays.find((s) => s.id === stayParam) ??
        null
      );
    }
    const stored = readSelectedStayId();
    if (stored) {
      const fromStored = confirmedBookings.find((s) => s.id === stored);
      if (fromStored) return fromStored;
    }
    return pickConfirmedStay(confirmedBookings);
  }, [stayParam, confirmedBookings, data.guestStays]);

  useEffect(() => {
    if (selectedStay) writeSelectedStayId(selectedStay.id);
  }, [selectedStay]);

  const villa = selectedStay
    ? data.villas.find((v) => v.id === selectedStay.villa_id) ??
      data.allOrgVillas.find((v) => v.id === selectedStay.villa_id)
    : null;
  const guide = selectedStay
    ? data.houseGuides.find((g) => g.villa_id === selectedStay.villa_id)
    : null;
  const photos = selectedStay
    ? data.stayPhotos.filter((p) => p.stay_id === selectedStay.id)
    : [];

  const checklist = useMemo(
    () =>
      (guide?.checkout_checklist ?? "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [guide?.checkout_checklist],
  );

  const [photoKind, setPhotoKind] = useState<"arrival" | "departure">("arrival");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);
  const [showBrowse, setShowBrowse] = useState(false);

  const canSelfCancel = selectedStay
    ? canGuestSelfCancelStay(selectedStay)
    : false;
  const cancelBlocked = selectedStay
    ? guestCancelBlockedReason(selectedStay)
    : null;

  const onAddPhoto = async (file: File | null) => {
    if (!file || !selectedStay) return;
    setPhotoError(null);
    try {
      const url = await data.uploadVillaPhoto(file);
      if (!url) throw new Error("Upload failed");
      await data.addStayPhoto({
        kind: photoKind,
        photo_url: url,
        stay_id: selectedStay.id,
      });
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : t("common.error"));
    }
  };

  return (
    <div className="space-y-4 animate-rise">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("guest.bookingGuideTitle")}
        </h1>
        <p className="text-sm text-muted">{t("guest.bookingGuideHint")}</p>
      </div>

      {confirmedBookings.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {confirmedBookings.map((s) => {
            const v =
              data.villas.find((x) => x.id === s.villa_id) ??
              data.allOrgVillas.find((x) => x.id === s.villa_id);
            const active = selectedStay?.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  writeSelectedStayId(s.id);
                  router.replace(`/villas?stay=${encodeURIComponent(s.id)}`);
                }}
                className={
                  active
                    ? "rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white"
                    : "rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink soft-shadow"
                }
              >
                {v?.name ?? formatShortDate(s.check_in)}
              </button>
            );
          })}
        </div>
      ) : null}

      {!selectedStay || !villa ? (
        <EmptyState
          title={t("guest.bookingGuideTitle")}
          description={t("guest.bookingGuideEmpty")}
        />
      ) : (
        <>
          <Card className="space-y-2 p-4">
            <p className="font-display text-lg font-bold text-ink">{villa.name}</p>
            <GuestVillaLocation
              area={villa.area}
              locationUrl={villa.location_url}
            />
            <p className="text-sm text-ink">
              {formatShortDate(selectedStay.check_in)} →{" "}
              {formatShortDate(selectedStay.check_out)}
            </p>
            {selectedStay.owner_notices ? (
              <div className="rounded-2xl bg-primary-soft/60 p-3 text-sm text-ink">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary">
                  {t("guest.notices")}
                </p>
                <LocalizedText
                  text={selectedStay.owner_notices}
                  as="p"
                  multiline
                />
              </div>
            ) : null}
          </Card>

          <GuestBriefingsCard stayId={selectedStay.id} />

          {guide ? (
            <Card className="space-y-3 p-4">
              <p className="font-display text-base font-bold text-ink">
                {t("guest.houseGuide")}
              </p>
              <div className="grid gap-2 text-sm">
                {guide.wifi_ssid ? (
                  <p className="flex gap-2">
                    <Wifi className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      <strong>{t("guest.wifi")}</strong>: {guide.wifi_ssid}
                      {guide.wifi_password ? (
                        <>
                          <br />
                          <span className="text-muted">
                            {t("guest.password")}: {guide.wifi_password}
                          </span>
                        </>
                      ) : null}
                    </span>
                  </p>
                ) : null}
                {guide.gate_code ? (
                  <p className="flex gap-2">
                    <KeyRound className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      <strong>{t("guest.gate")}</strong>: {guide.gate_code}
                    </span>
                  </p>
                ) : null}
                {guide.quiet_hours ? (
                  <p>
                    <strong>{t("guest.quietHours")}</strong>:{" "}
                    {guide.quiet_hours}
                  </p>
                ) : null}
                {guide.bins_notes ? (
                  <p>
                    <strong>{t("guest.bins")}</strong>:{" "}
                    <LocalizedText text={guide.bins_notes} />
                  </p>
                ) : null}
                {checklist.length ? (
                  <div>
                    <strong>{t("guest.checkout")}</strong>
                    <ul className="mt-1 list-disc pl-5 text-muted">
                      {checklist.map((item) => (
                        <li key={item}>
                          <LocalizedText text={item} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {guide.extra_notes ? (
                  <p className="text-muted">
                    <LocalizedText text={guide.extra_notes} />
                  </p>
                ) : null}
              </div>
            </Card>
          ) : null}

          <Card className="space-y-3 p-4">
            <p className="font-display text-base font-bold text-ink">
              {t("guest.photosTitle")}
            </p>
            <p className="text-sm text-muted">{t("guest.photosHint")}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={photoKind === "arrival" ? "primary" : "ghost"}
                className="rounded-full"
                onClick={() => setPhotoKind("arrival")}
              >
                {t("guest.arrival")}
              </Button>
              <Button
                type="button"
                variant={photoKind === "departure" ? "primary" : "ghost"}
                className="rounded-full"
                onClick={() => setPhotoKind("departure")}
              >
                {t("guest.departure")}
              </Button>
              <Button
                type="button"
                className="rounded-full"
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="size-4" />
                {t("guest.addPhoto")}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onAddPhoto(e.target.files?.[0] ?? null)}
              />
            </div>
            {photoError ? (
              <p className="text-sm text-danger">{photoError}</p>
            ) : null}
            {photos.length ? (
              <div className="grid grid-cols-2 gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-xl bg-sand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.photo_url}
                      alt=""
                      className="h-28 w-full object-cover"
                    />
                    <p className="px-2 py-1 text-[11px] text-muted">
                      {p.kind === "arrival"
                        ? t("guest.arrival")
                        : t("guest.departure")}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          {selectedStay.status === "upcoming" ||
          selectedStay.status === "active" ? (
            <Card className="space-y-2 border border-danger/20 p-4">
              <p className="font-display text-base font-bold text-ink">
                {t("guest.cancelBookingTitle")}
              </p>
              <p className="text-sm text-muted">
                {t("guest.cancelBookingDescription")}
              </p>
              {canSelfCancel ? (
                <>
                  {cancelMsg ? (
                    <p className="text-sm font-semibold text-secondary">
                      {cancelMsg}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-danger"
                    disabled={cancelBusy}
                    onClick={() => {
                      if (
                        !window.confirm(
                          t("guest.cancelBookingConfirm", {
                            villa: villa.name,
                            from: formatShortDate(selectedStay.check_in),
                            to: formatShortDate(selectedStay.check_out),
                          }),
                        )
                      ) {
                        return;
                      }
                      setCancelBusy(true);
                      setCancelMsg(null);
                      void data
                        .cancelGuestStay(selectedStay.id)
                        .then(() => {
                          setCancelMsg(t("guest.cancelBookingDone"));
                          writeSelectedStayId(null);
                          router.replace("/home");
                        })
                        .catch((e) =>
                          setCancelMsg(
                            e instanceof Error ? e.message : t("common.error"),
                          ),
                        )
                        .finally(() => setCancelBusy(false));
                    }}
                  >
                    {t("guest.cancelBookingButton")}
                  </Button>
                </>
              ) : cancelBlocked ? (
                <Link
                  href="/messages"
                  className="inline-block text-sm font-bold text-primary"
                >
                  {t("guest.openSupportChat")} →
                </Link>
              ) : null}
            </Card>
          ) : null}
        </>
      )}

      <div className="border-t border-black/5 pt-4">
        <button
          type="button"
          className="text-sm font-bold text-primary"
          onClick={() => setShowBrowse((v) => !v)}
        >
          {showBrowse ? t("guest.hideBrowseVillas") : t("guest.browseVillas")}{" "}
          {showBrowse ? "↑" : "↓"}
        </button>
        {showBrowse ? <GuestVillasBrowseCompact /> : null}
      </div>
    </div>
  );
}

/** Compact property browse for requesting additional stays. */
function GuestVillasBrowseCompact() {
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
      <p className="mt-3 text-sm text-muted">{t("guest.villasEmpty")}</p>
    );
  }

  return (
    <div className="mt-3 space-y-3">
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
      {ok ? <p className="text-sm font-semibold text-secondary">{ok}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
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
