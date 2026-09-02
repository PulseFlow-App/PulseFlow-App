"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  KeyRound,
  MapPin,
  Wifi,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data/use-app-data";
import { formatShortDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import { StayQuoteCard } from "@/components/guest/stay-quote-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  canGuestSelfCancelStay,
  guestCancelBlockedReason,
} from "@/lib/guest/cancel-booking";
import { activeAcceptedRequestForVilla } from "@/lib/guest/stay-date-request";

export function GuestHome({ name }: { name: string }) {
  const data = useData();
  const { t } = useI18n();
  const first = name.split(" ")[0] || name;
  const stay = data.activeStay;
  const villa = stay
    ? data.villas.find((v) => v.id === stay.villa_id) ??
      data.allOrgVillas.find((v) => v.id === stay.villa_id)
    : null;
  const guide = stay
    ? data.houseGuides.find((g) => g.villa_id === stay.villa_id)
    : null;
  const photos = data.stayPhotos.filter((p) => p.stay_id === stay?.id);
  const acceptedQuote =
    stay && villa
      ? activeAcceptedRequestForVilla(
          data.stayDateRequests,
          data.guestStays,
          villa.id,
          stay.guest_profile_id,
        )
      : undefined;
  const stayDeposit = stay
    ? data.guestDeposits.find((d) => d.stay_id === stay.id)
    : null;
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [quoteMsg, setQuoteMsg] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoKind, setPhotoKind] = useState<"arrival" | "departure">("arrival");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);
  const [declineQuoteId, setDeclineQuoteId] = useState<string | null>(null);

  const canSelfCancel = stay ? canGuestSelfCancelStay(stay) : false;
  const cancelBlocked = stay ? guestCancelBlockedReason(stay) : null;

  const checklist = useMemo(
    () =>
      (guide?.checkout_checklist ?? "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [guide?.checkout_checklist],
  );

  const onAddPhoto = async (file: File | null) => {
    if (!file || !stay) return;
    setPhotoError(null);
    try {
      const url = await data.uploadVillaPhoto(file);
      if (!url) throw new Error("Upload failed");
      await data.addStayPhoto({ kind: photoKind, photo_url: url });
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : t("common.error"));
    }
  };

  if (!stay || !villa) {
    const quotedRequest = data.stayDateRequests.find(
      (r) => r.status === "quoted" && r.quoted_price_amount != null,
    );

    return (
      <div className="space-y-4 animate-rise">
        <ConfirmDialog
          open={declineQuoteId != null}
          title={t("guest.quoteDeclineTitle")}
          description={t("guest.quoteDeclineConfirm")}
          confirmLabel={t("guest.quoteDecline")}
          busy={quoteBusy}
          onConfirm={() => {
            if (!declineQuoteId) return;
            setQuoteBusy(true);
            void data
              .cancelStayDateRequest(declineQuoteId)
              .then(() => {
                setQuoteMsg(t("guest.requestCancelled"));
                setDeclineQuoteId(null);
              })
              .catch((e) =>
                setQuoteMsg(
                  e instanceof Error ? e.message : t("common.error"),
                ),
              )
              .finally(() => setQuoteBusy(false));
          }}
          onClose={() => {
            if (!quoteBusy) setDeclineQuoteId(null);
          }}
        />
        <div>
          <p className="text-sm text-muted">{t("guest.homeSubtitle")}</p>
          <h1 className="font-display text-2xl font-bold text-ink">
            {t("guest.homeTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t("guest.hi", { name: first })}
          </p>
        </div>
        {quotedRequest ? (
          <>
            {quoteMsg ? (
              <p className="text-sm font-semibold text-secondary">{quoteMsg}</p>
            ) : null}
            <StayQuoteCard
              request={quotedRequest}
              busy={quoteBusy}
              onConfirm={() => {
                setQuoteBusy(true);
                void data
                  .confirmStayDateRequest(quotedRequest.id)
                  .then(() => setQuoteMsg(t("guest.quoteConfirmed")))
                  .catch((e) =>
                    setQuoteMsg(
                      e instanceof Error ? e.message : t("common.error"),
                    ),
                  )
                  .finally(() => setQuoteBusy(false));
              }}
              onDecline={() => setDeclineQuoteId(quotedRequest.id)}
            />
          </>
        ) : (
          <Card className="p-5">
            <p className="text-sm text-muted">{t("guest.noStay")}</p>
            <Link
              href="/villas"
              className="mt-3 inline-block text-sm font-bold text-primary"
            >
              {t("guest.browseVillas")}
            </Link>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-rise">
      <div>
        <p className="text-sm text-muted">{t("guest.homeSubtitle")}</p>
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("guest.homeTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {t("guest.hi", { name: first })}
        </p>
      </div>

      {acceptedQuote ? (
        <StayQuoteCard request={acceptedQuote} deposit={stayDeposit} />
      ) : null}

      <Card className="space-y-3 overflow-hidden p-0">
        {villa.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={villa.photo_url}
            alt=""
            className="h-40 w-full object-cover"
          />
        ) : null}
        <div className="space-y-2 p-4">
          <p className="font-display text-lg font-bold text-ink">{villa.name}</p>
          {villa.area ? (
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="size-3.5" />
              {villa.area}
            </p>
          ) : null}
          <p className="text-sm text-ink">
            {formatShortDate(stay.check_in)} → {formatShortDate(stay.check_out)}
          </p>
          {stay.owner_notices ? (
            <div className="rounded-2xl bg-primary-soft/60 p-3 text-sm text-ink">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary">
                {t("guest.notices")}
              </p>
              <LocalizedText
                text={stay.owner_notices}
                as="p"
                multiline
              />
            </div>
          ) : null}
        </div>
      </Card>

      {stay.status === "upcoming" || stay.status === "active" ? (
        <Card className="space-y-2 p-4">
          <p className="font-display text-base font-bold text-ink">
            {t("guest.cancelBookingTitle")}
          </p>
          {canSelfCancel ? (
            <>
              <p className="text-sm text-muted">{t("guest.cancelBookingHint")}</p>
              {cancelMsg ? (
                <p className="text-sm font-semibold text-secondary">{cancelMsg}</p>
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
                        from: formatShortDate(stay.check_in),
                        to: formatShortDate(stay.check_out),
                      }),
                    )
                  ) {
                    return;
                  }
                  setCancelBusy(true);
                  setCancelMsg(null);
                  void data
                    .cancelGuestStay(stay.id)
                    .then(() => setCancelMsg(t("guest.cancelBookingDone")))
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
            <div className="space-y-2 text-sm">
              <p className="text-muted">
                {t(
                  cancelBlocked === "too_late"
                    ? "guest.cancelBookingTooLate"
                    : "guest.cancelBookingContactSupport",
                )}
              </p>
              <Link
                href="/messages"
                className="inline-block font-bold text-primary"
              >
                {t("guest.openSupportChat")} →
              </Link>
            </div>
          ) : null}
        </Card>
      ) : null}

      {data.guestBriefings.filter((b) => b.stay_id === stay.id).length ? (
        <Card className="space-y-3 p-4">
          <div>
            <p className="font-display text-base font-bold text-ink">
              {t("guest.briefingsTitle")}
            </p>
            <p className="text-xs text-muted">{t("guest.briefingsHint")}</p>
          </div>
          {data.guestBriefings
            .filter((b) => b.stay_id === stay.id)
            .map((b) => (
              <div
                key={b.id}
                className="rounded-2xl bg-[#F7F5F1] p-3 text-sm text-ink"
              >
                <p className="font-bold">
                  <LocalizedText text={b.title} />
                </p>
                <LocalizedText
                  text={b.body}
                  as="p"
                  className="mt-1"
                  multiline
                />
                {b.confirmed_at ? (
                  <p className="mt-2 text-xs font-bold text-secondary">
                    {t("guest.confirmedRead")}
                  </p>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2"
                    onClick={() => void data.confirmGuestBriefing(b.id)}
                  >
                    {t("guest.confirmRead")}
                  </Button>
                )}
              </div>
            ))}
        </Card>
      ) : null}

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
                <strong>{t("guest.quietHours")}</strong>: {guide.quiet_hours}
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
    </div>
  );
}
