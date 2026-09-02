"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, KeyRound, Wifi } from "lucide-react";
import { GuestVillaLocation } from "@/components/guest/guest-villa-location";
import { GuestBriefingsCard } from "@/components/guest/guest-briefings-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import { formatShortDate } from "@/lib/utils";
import {
  canGuestSelfCancelStay,
  guestCancelBlockedReason,
} from "@/lib/guest/cancel-booking";
import { isConfirmedStayStatus, pickConfirmedStay } from "@/lib/guest/confirmed-stay";
import {
  readSelectedStayId,
  writeSelectedStayId,
} from "@/lib/guest/selected-stay";

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
        <Card className="p-5">
          <p className="text-sm text-muted">{t("guest.bookingGuideEmpty")}</p>
          <Link
            href="/home"
            className="mt-3 inline-block text-sm font-bold text-primary"
          >
            {t("guest.browseVillas")} →
          </Link>
        </Card>
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
    </div>
  );
}
