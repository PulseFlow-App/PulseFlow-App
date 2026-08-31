"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { VillaPhotoThumb } from "@/components/villas/villa-photo";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import { useLocalizedDemoText } from "@/lib/demo/use-localized-demo-text";
import { todayIsoDate } from "@/lib/villas/status-from-dates";

export function GuestVillasBrowse() {
  const data = useData();
  const { t } = useI18n();
  const label = useLocalizedDemoText();
  const villas = data.villaList.filter((v) => v.bucket === "company");
  const minDate = todayIsoDate();
  const [requestFor, setRequestFor] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

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
    const floor = checkIn && checkIn > minDate ? checkIn : minDate;
    if (value && value <= floor) {
      setCheckOut("");
      setError(t("guest.requestCheckoutAfter"));
      return;
    }
    if (value && value < minDate) {
      setCheckOut("");
      setError(t("guest.requestPastDates"));
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
        <p className="text-sm text-muted">{t("guest.villasHint")}</p>
      </div>

      {ok ? <p className="text-sm font-semibold text-secondary">{ok}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="space-y-3">
        {villas.map((v) => {
          const pending = data.stayDateRequests.find(
            (r) => r.villa_id === v.id && r.status === "pending",
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
                    {label(v.name)}
                  </p>
                  <StatusPill status={v.status} />
                </div>
                {v.area ? (
                  <p className="flex items-center gap-1 text-sm text-muted">
                    <MapPin className="size-3.5" />
                    {label(v.area)}
                  </p>
                ) : null}
                {v.description ? (
                  <p className="text-sm text-muted">{label(v.description)}</p>
                ) : null}

                {pending ? (
                  <p className="text-sm text-muted">
                    {t("guest.requestPending", {
                      from: pending.check_in,
                      to: pending.check_out,
                    })}
                  </p>
                ) : requestFor === v.id ? (
                  <div className="space-y-2 rounded-2xl bg-[#F7F5F1] p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`in-${v.id}`}>
                          {t("guest.checkIn")}
                        </Label>
                        <Input
                          id={`in-${v.id}`}
                          type="date"
                          min={minDate}
                          value={checkIn}
                          onChange={(e) => setSafeCheckIn(e.target.value)}
                          onBlur={() => {
                            if (checkIn && checkIn < minDate) setSafeCheckIn("");
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`out-${v.id}`}>
                          {t("guest.checkOut")}
                        </Label>
                        <Input
                          id={`out-${v.id}`}
                          type="date"
                          min={checkIn && checkIn > minDate ? checkIn : minDate}
                          value={checkOut}
                          onChange={(e) => setSafeCheckOut(e.target.value)}
                          onBlur={() => {
                            if (checkOut && checkOut < minDate) {
                              setSafeCheckOut("");
                            }
                          }}
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
