"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import { formatShortDate } from "@/lib/utils";
import { todayIsoDate } from "@/lib/villas/status-from-dates";

export function VillaMaintenanceLog({ villaId }: { villaId: string }) {
  const data = useData();
  const { t } = useI18n();
  const role = data.profile?.role;
  const canWrite = role && role !== "guest";
  const canDelete = (createdBy: string | null) =>
    role === "owner" ||
    role === "manager" ||
    (createdBy != null && createdBy === data.profile?.id);

  const logs = data.villaMaintenanceLogs.filter((l) => l.villa_id === villaId);

  const [item, setItem] = useState("");
  const [loggedOn, setLoggedOn] = useState(todayIsoDate());
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);

  const add = async () => {
    if (!canWrite) return;
    setBusy(true);
    setError(null);
    try {
      let photo_url: string | null = null;
      if (photoFile) {
        photo_url = await data.uploadVillaPhoto(photoFile);
      }
      await data.addVillaMaintenanceLog({
        villa_id: villaId,
        item,
        logged_on: loggedOn,
        description,
        vendor,
        photo_url,
      });
      setItem("");
      setDescription("");
      setVendor("");
      setPhotoFile(null);
      setLoggedOn(todayIsoDate());
      setOpenForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  if (role === "guest") return null;

  return (
    <Card className="mt-4 space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-base font-bold text-ink">
            {t("villas.maintTitle")}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-muted">
            {t("villas.maintHint")}
          </p>
        </div>
        {canWrite && !openForm ? (
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0"
            onClick={() => setOpenForm(true)}
          >
            {t("villas.maintAdd")}
          </Button>
        ) : null}
      </div>

      {openForm ? (
        <div className="space-y-2 rounded-2xl bg-canvas-deep p-3">
          <div className="min-w-0">
            <Label htmlFor="maint-item">{t("villas.maintItem")}</Label>
            <Input
              id="maint-item"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder={t("villas.maintItemPh")}
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="maint-date">{t("villas.maintDate")}</Label>
            <Input
              id="maint-date"
              type="date"
              value={loggedOn}
              onChange={(e) => setLoggedOn(e.target.value)}
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="maint-desc">{t("villas.maintDesc")}</Label>
            <Textarea
              id="maint-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("villas.maintDescPh")}
              className="text-sm"
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="maint-vendor">{t("villas.maintVendor")}</Label>
            <Input
              id="maint-vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder={t("villas.maintVendorPh")}
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="maint-photo">{t("villas.maintPhoto")}</Label>
            <Input
              id="maint-photo"
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {error ? (
            <p className="text-sm font-semibold text-danger">{error}</p>
          ) : null}
          <div className="flex gap-2">
            <Button
              size="sm"
              busy={busy}
              disabled={!item.trim()}
              onClick={() => void add()}
            >
              {t("common.save")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setOpenForm(false);
                setError(null);
              }}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : null}

      {logs.length === 0 ? (
        <p className="text-sm text-muted">{t("villas.maintEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li
              key={log.id}
              className="rounded-2xl border border-black/5 px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug text-ink">
                    {log.item}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {formatShortDate(log.logged_on)}
                    {log.vendor ? ` · ${log.vendor}` : ""}
                  </p>
                </div>
                {canDelete(log.created_by) ? (
                  <button
                    type="button"
                    className="shrink-0 rounded-full p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                    aria-label={t("common.delete")}
                    onClick={() =>
                      void data.deleteVillaMaintenanceLog(log.id).catch((e) =>
                        setError(
                          e instanceof Error ? e.message : t("common.error"),
                        ),
                      )
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </div>
              {log.description ? (
                <p className="mt-1 text-sm leading-snug text-ink">
                  {log.description}
                </p>
              ) : null}
              {log.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={log.photo_url}
                  alt=""
                  className="mt-2 max-h-40 w-full rounded-xl object-cover"
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
