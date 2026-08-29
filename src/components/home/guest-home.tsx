"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BedDouble,
  Camera,
  KeyRound,
  MapPin,
  MessageCircle,
  Receipt,
  Wifi,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data/use-app-data";
import { formatShortDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

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
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoKind, setPhotoKind] = useState<"arrival" | "departure">("arrival");

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
        <Card className="p-5">
          <p className="text-sm text-muted">{t("guest.noStay")}</p>
          <Link
            href="/villas"
            className="mt-3 inline-block text-sm font-bold text-primary"
          >
            {t("guest.browseVillas")}
          </Link>
        </Card>
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
              {stay.owner_notices}
            </div>
          ) : null}
        </div>
      </Card>

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
                <strong>{t("guest.bins")}</strong>: {guide.bins_notes}
              </p>
            ) : null}
            {checklist.length ? (
              <div>
                <strong>{t("guest.checkout")}</strong>
                <ul className="mt-1 list-disc pl-5 text-muted">
                  {checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {guide.extra_notes ? (
              <p className="text-muted">{guide.extra_notes}</p>
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

      <div className="grid grid-cols-3 gap-3">
        <Link href="/villas">
          <Card className="space-y-2 p-4 transition hover:bg-primary-soft/40">
            <BedDouble className="size-5 text-primary" />
            <p className="text-sm font-semibold text-ink">
              {t("guest.nav.villas")}
            </p>
          </Card>
        </Link>
        <Link href="/messages">
          <Card className="space-y-2 p-4 transition hover:bg-primary-soft/40">
            <MessageCircle className="size-5 text-secondary" />
            <p className="text-sm font-semibold text-ink">
              {t("guest.nav.support")}
            </p>
          </Card>
        </Link>
        <Link href="/bills">
          <Card className="space-y-2 p-4 transition hover:bg-primary-soft/40">
            <Receipt className="size-5 text-warning-dark" />
            <p className="text-sm font-semibold text-ink">
              {t("guest.nav.bills")}
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
